import { Global, Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { UploadsService } from './uploads.service';

@Global()
@Module({
  controllers: [MediaController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
