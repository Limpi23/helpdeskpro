import { Injectable } from '@nestjs/common';

@Injectable()
export class RemoteService {
  getSessions() {
    return { message: 'Remote sessions - WebRTC implementation needed' };
  }
} 