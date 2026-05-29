import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from '../common/dto/create-booking.dto';
import { SubmitComplaintDto } from '../common/dto/submit-complaint.dto';
import { AdminGuard } from '../common/guards/auth.guard';

@Controller('api')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /* ── Rides ─────────────────────────────────────────────── */

  @Get('rides')
  getRideHistory(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getRideHistory(page, limit);
  }

  @Get('rides/last')
  getLastRide() {
    return this.bookingService.getLastRide();
  }

  @Get('rides/:id')
  getRideDetails(@Param('id') id: string) {
    return this.bookingService.getRideDetails(id);
  }

  /* ── Bookings ──────────────────────────────────────────── */

  @Get('bookings')
  getBookings(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getBookings(page, limit);
  }

  @Post('bookings')
  createBooking(@Body() bookingData: CreateBookingDto) {
    return this.bookingService.createBooking(bookingData);
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.bookingService.getBooking(id);
  }

  @Post('bookings/:id/cancel')
  cancelBooking(@Param('id') id: string) {
    return this.bookingService.cancelBooking(id);
  }

  @Patch('bookings/:id/complete')
  completeBooking(@Param('id') id: string) {
    return this.bookingService.completeBooking(id);
  }

  /* ── Complaints ────────────────────────────────────────── */

  @Post('complaints')
  submitComplaint(@Body() complaintData: SubmitComplaintDto) {
    return this.bookingService.submitComplaint(complaintData);
  }

  @Get('complaints')
  getComplaints(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookingService.getComplaints(page, limit);
  }

  @Get('complaints/:id')
  getComplaint(@Param('id') id: string) {
    return this.bookingService.getComplaint(id);
  }

  @Patch('complaints/:id/resolve')
  @UseGuards(AdminGuard)
  resolveComplaint(@Param('id') id: string) {
    return this.bookingService.resolveComplaint(id);
  }
}
