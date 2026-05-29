import { Controller, Get } from '@nestjs/common';
import { DbService } from '../db/db.service';
import * as fs from 'fs';

@Controller('api')
export class HealthController {
  constructor(private readonly dbService: DbService) {}

  @Get('hello')
  getHello(): string {
    return 'Hello World!';
  }

  @Get('health')
  getHealth() {
    const memory = process.memoryUsage();
    const dbFile = this.dbService.getDbFilePath();
    
    // Check persistence status
    let dbStatus = 'healthy';
    let dbSizeBytes = 0;
    try {
      if (fs.existsSync(dbFile)) {
        dbSizeBytes = fs.statSync(dbFile).size;
      } else {
        dbStatus = 'no_db_file';
      }
    } catch (e: any) {
      dbStatus = `unhealthy: ${e.message}`;
    }

    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      systemMetrics: {
        memoryHeapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        memoryHeapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        memoryRssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      persistence: {
        status: dbStatus,
        filePath: dbFile,
        dbSizeBytes,
      },
      integrations: {
        monnify: {
          apiKeyConfigured: !!(process.env.APIKEY || '').trim(),
          secretKeyConfigured: !!(process.env.Secret_Key || '').trim(),
          contractCodeConfigured: !!(process.env.Contract_Code || '').trim(),
        },
        africasTalking: {
          apiKeyConfigured: !!(process.env.AT_API_KEY || '').trim(),
          usernameConfigured: !!(process.env.AT_USERNAME || '').trim(),
        }
      }
    };
  }
}
