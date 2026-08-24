import { Global, Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';
import { UploadsService } from './uploads.service';

@Global()
@Module({
  controllers: [MediaController],
  providers: [CloudinaryService, UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
