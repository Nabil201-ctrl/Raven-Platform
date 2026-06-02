import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleDestroy } from '@nestjs/common';
import { DbService } from '../db/db.service';

@WebSocketGateway({
  cors: {
    origin: '*', // flexible fallback for sandbox testing
  },
  namespace: 'booking',
})
export class BookingGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger('BookingGateway');

  // Track active seat locks in memory: Map<shuttleId, Map<seatNumber, { userId, expiresAt }>>
  private activeLocks = new Map<string, Map<number, { userId: string; expiresAt: number }>>();
  private lockCleanupInterval: ReturnType<typeof setInterval>;

  constructor(private readonly db: DbService) {
    // Automatically clean up expired locks every 5 seconds
    this.lockCleanupInterval = setInterval(() => this.cleanupExpiredLocks(), 5000);
  }

  onModuleDestroy() {
    clearInterval(this.lockCleanupInterval);
    this.logger.log('Graceful shutdown: disconnecting all WebSocket clients...');
    if (this.server) {
      this.server.disconnectSockets(true);
    }
  }

  handleConnection(client: Socket) {
    // WebSocket authentication: validate userId from handshake query
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      this.logger.warn(` Client ${client.id} connected without userId — allowing anonymous (sandbox mode)`);
    } else {
      (client as any).userId = userId;
      this.logger.log(` Client connected: ${client.id} (User: ${userId})`);
    }
    
    // Send immediate initial sync of available shuttles and active reverse trips to new client
    client.emit('sync:initial', {
      shuttles: this.db.shuttles,
      reverseTrips: this.db.reverseTrips.slice(0, 5),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(` Client disconnected: ${client.id}`);
    this.unlockAllSeatsForUser(client.id);
  }

  @SubscribeMessage('room:join')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.join(data.roomId);
    this.logger.log(` Client ${client.id} joined room: ${data.roomId}`);
    
    // If the room is for a shuttle (e.g., 'shuttle_sh_1001'), send active seat locks for that shuttle
    if (data.roomId.startsWith('shuttle_')) {
      const shuttleId = data.roomId.replace('shuttle_', '');
      const shuttleLocks = this.getShuttleLocksObject(shuttleId);
      client.emit('seat:locks:sync', { shuttleId, locks: shuttleLocks });
    }
  }

  @SubscribeMessage('room:leave')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    this.logger.log(` Client ${client.id} left room: ${data.roomId}`);
  }

  @SubscribeMessage('seat:lock')
  handleSeatLock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shuttleId: string; seatNumber: number; userId?: string },
  ) {
    const userId = data.userId || client.id;
    const shuttleId = data.shuttleId;
    const seatNumber = data.seatNumber;

    if (!shuttleId || !seatNumber) return;

    if (!this.activeLocks.has(shuttleId)) {
      this.activeLocks.set(shuttleId, new Map());
    }

    const shuttleLocks = this.activeLocks.get(shuttleId)!;
    const existingLock = shuttleLocks.get(seatNumber);

    // If seat is already locked by someone else, deny
    if (existingLock && existingLock.userId !== userId && existingLock.expiresAt > Date.now()) {
      client.emit('seat:lock:denied', { shuttleId, seatNumber, message: 'Seat is already locked by another passenger' });
      return;
    }

    // Apply lock for 2 minutes (standard booking window time)
    const expiresAt = Date.now() + 2 * 60 * 1000;
    shuttleLocks.set(seatNumber, { userId, expiresAt });

    this.logger.log(` Seat ${seatNumber} locked on Shuttle ${shuttleId} by User ${userId}`);

    // Broadcast lock update to all users in the specific shuttle room
    this.server.to(`shuttle_${shuttleId}`).emit('seat:locked', {
      shuttleId,
      seatNumber,
      userId,
      expiresAt,
    });
  }

  @SubscribeMessage('seat:unlock')
  handleSeatUnlock(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { shuttleId: string; seatNumber: number; userId?: string },
  ) {
    const userId = data.userId || client.id;
    const shuttleId = data.shuttleId;
    const seatNumber = data.seatNumber;

    if (!shuttleId || !seatNumber) return;

    const shuttleLocks = this.activeLocks.get(shuttleId);
    if (shuttleLocks) {
      const lock = shuttleLocks.get(seatNumber);
      if (lock && lock.userId === userId) {
        shuttleLocks.delete(seatNumber);
        this.logger.log(` Seat ${seatNumber} unlocked on Shuttle ${shuttleId} by User ${userId}`);
        
        // Broadcast unlock to all users in the shuttle room
        this.server.to(`shuttle_${shuttleId}`).emit('seat:unlocked', {
          shuttleId,
          seatNumber,
        });
      }
    }
  }

  @SubscribeMessage('driver:telemetry:update')
  handleDriverTelemetry(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { driverId: string; latitude: number; longitude: number; speed?: number },
  ) {
    // Broadcast live driver GPS coordinates to all clients tracking that driver
    this.logger.debug(` Telemetry from Driver ${data.driverId}: ${data.latitude}, ${data.longitude}`);
    this.server.to(`driver_${data.driverId}`).emit('driver:telemetry', data);
    // Also broadcast to a general tracking channel
    this.server.to('tracking:live').emit('driver:telemetry', data);
  }

  // --- External service triggering helpers ---
  
  // Call this when a new booking is finalized to sync seat layout updates instantly
  broadcastShuttleUpdate(shuttleId: string, shuttle: any) {
    this.logger.log(` Broadcasting live seat layout update for Shuttle ${shuttleId}`);
    // Update general lists
    this.server.emit('shuttle:updated', shuttle);
    // Update details in shuttle room
    this.server.to(`shuttle_${shuttleId}`).emit('shuttle:details:updated', shuttle);
    
    // Automatically clear any active locks on newly booked seats
    const shuttleLocks = this.activeLocks.get(shuttleId);
    if (shuttleLocks && shuttle.bookedSeats) {
      for (const seat of shuttle.bookedSeats) {
        if (shuttleLocks.has(seat)) {
          shuttleLocks.delete(seat);
          this.server.to(`shuttle_${shuttleId}`).emit('seat:unlocked', { shuttleId, seatNumber: seat });
        }
      }
    }
  }

  // Call this when an inbound reverse trip is auto-generated
  broadcastReverseTripAlert(reverseTrip: any) {
    this.logger.log(` Broadcasting Inbound Reverse Trip Alert: ${reverseTrip.vehicleCode}`);
    this.server.emit('transit:reverse-trip:added', reverseTrip);
  }

  // --- Internals ---
  private getShuttleLocksObject(shuttleId: string) {
    const shuttleLocks = this.activeLocks.get(shuttleId);
    if (!shuttleLocks) return {};
    
    const obj: Record<number, { userId: string; expiresAt: number }> = {};
    for (const [seatNumber, lock] of shuttleLocks.entries()) {
      if (lock.expiresAt > Date.now()) {
        obj[seatNumber] = lock;
      }
    }
    return obj;
  }

  private unlockAllSeatsForUser(clientId: string) {
    for (const [shuttleId, shuttleLocks] of this.activeLocks.entries()) {
      for (const [seatNumber, lock] of shuttleLocks.entries()) {
        if (lock.userId === clientId) {
          shuttleLocks.delete(seatNumber);
          this.server.to(`shuttle_${shuttleId}`).emit('seat:unlocked', {
            shuttleId,
            seatNumber,
          });
        }
      }
    }
  }

  private cleanupExpiredLocks() {
    const now = Date.now();
    for (const [shuttleId, shuttleLocks] of this.activeLocks.entries()) {
      for (const [seatNumber, lock] of shuttleLocks.entries()) {
        if (lock.expiresAt <= now) {
          shuttleLocks.delete(seatNumber);
          this.logger.log(` Lock expired on Seat ${seatNumber} of Shuttle ${shuttleId}`);
          this.server.to(`shuttle_${shuttleId}`).emit('seat:unlocked', {
            shuttleId,
            seatNumber,
          });
        }
      }
    }
  }
}
