import { Controller, Get } from '@nestjs/common';
import { RemoteService } from './remote.service';

@Controller('remote')
export class RemoteController {
  constructor(private readonly remoteService: RemoteService) {}

  @Get('sessions')
  getSessions() {
    return this.remoteService.getSessions();
  }
} 