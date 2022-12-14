import { Body, Controller, HttpCode, HttpStatus, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { UploadService } from './upload.service'
import { UploadDto } from './upload.dto'

@Controller('upload')
export class UploadController {
    constructor(private uploadService: UploadService) {}

    @HttpCode(HttpStatus.CREATED)
    @Post()
    @UseInterceptors(FileInterceptor('fileToUpload'))
    uploadToS3(@Body() bodyObj: UploadDto, @UploadedFile() fileObj: Express.Multer.File) {
        return this.uploadService.fileHandler(bodyObj, fileObj)
    }
}
