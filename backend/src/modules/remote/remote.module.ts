import { Module } from '@nestjs/common';
import { RemoteController } from './remote.controller';
import { RemoteService } from './remote.service';

@Module({
  controllers: [RemoteController],
  providers: [RemoteService],
  exports: [RemoteService],
})
export class RemoteModule {} 