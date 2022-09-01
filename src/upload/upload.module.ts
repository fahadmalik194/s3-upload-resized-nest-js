import { Module } from '@nestjs/common'
import { UploadService } from './upload.service'
import { UploadController } from './upload.controller'
import { UploadFileResponse } from './uploadMessages.response'

@Module({
    providers: [UploadService, UploadFileResponse],
    controllers: [UploadController],
})
export class UploadModule {}
