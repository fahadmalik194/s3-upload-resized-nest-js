import { Injectable, ForbiddenException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

import * as AWS from 'aws-sdk'
import * as Sharp from 'sharp'

import { UploadDto } from './upload.dto'
import { UploadFileResponse } from './uploadMessages.response'

@Injectable()
export class UploadService {
    constructor(private config: ConfigService, private uploadFileResponse: UploadFileResponse) {}
    private isImageFlag: boolean = false
    private S3 = new AWS.S3({
        region: this.config.get('AWS_S3_REGION'),
        accessKeyId: this.config.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.get('AWS_ACCESS_KEY_SECRET'),
    })

    async fileHandler(bodyObj: UploadDto, fileObj: Express.Multer.File) {
        if (fileObj) this.isImageFlag = await this.isImage(fileObj.mimetype.split('/')[0])
        else throw new ForbiddenException(this.uploadFileResponse.getNoFileAttachedError())

        if (!(await this.isValidFileExtentions(fileObj.mimetype.split('/')[1])))
            throw new ForbiddenException(this.uploadFileResponse.getInValidExtentionError(fileObj.mimetype.split('/')[1]))
        if (!(await this.isValidFileSize(fileObj.size))) throw new ForbiddenException(this.uploadFileResponse.getInValidFileSizeError(fileObj.size))

        if (this.isImageFlag) {
            if (!(await this.isValidFileDimensions(bodyObj.imageSize)))
                throw new ForbiddenException(this.uploadFileResponse.getImageSizeError(bodyObj.imageSize))

            let width = '',
                height = ''

            const dir = './uploads'
            if (!existsSync(dir)) mkdirSync(dir)

            const outputDir = join(process.cwd(), './uploads/' + fileObj.originalname)

            if (bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[0]) {
                width = this.config.get('LARGE_IMAGE_WIDTH')
                height = this.config.get('LARGE_IMAGE_HEIGHT')
            } else if (bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[1]) {
                width = this.config.get('MEDIUM_IMAGE_WIDTH')
                height = this.config.get('MEDIUM_IMAGE_HEIGHT')
            } else if (bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[2]) {
                width = this.config.get('THUMBNAIL_IMAGE_WIDTH')
                height = this.config.get('THUMBNAIL_IMAGE_HEIGHT')
            }

            try {
                await Sharp(fileObj.buffer).resize(parseInt(width), parseInt(height)).toFile(outputDir)
                const ResizedImagebuffer = readFileSync(outputDir)
                return await this.uploadOnS3Bucket({
                    originalname: fileObj.originalname,
                    buffer: ResizedImagebuffer,
                    mimetype: fileObj.mimetype,
                })
            } catch (e) {
                throw new ForbiddenException(e.message)
            }
        } else {
            return await this.uploadOnS3Bucket(fileObj)
        }
    }

    async uploadOnS3Bucket(fileObj) {
        const { originalname, buffer, mimetype } = fileObj
        const params = {
            Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
            Key: originalname,
            Body: buffer,
            ACL: this.config.get('AWS_S3_ACL'),
            ContentType: mimetype,
            ContentDisposition: 'inline',
            CreateBucketConfiguration: {
                LocationConstraint: this.config.get('AWS_S3_REGION'),
            },
        }
        try {
            let s3Response = await this.S3.upload(params).promise()
            return {
                status: true,
                message: 'File Uploaded to S3',
                data: s3Response,
            }
        } catch (e) {
            throw new ForbiddenException(e.message)
        }
    }

    async isValidFileExtentions(fileExtention) {
        return await this.config.get('VALID_FILE_EXTENSIONS').split(' ').includes(fileExtention)
    }

    async isValidFileSize(fileSize) {
        return parseInt(fileSize) < this.config.get('MAX_FILE_SIZE_IN_KB')
    }

    async isImage(fileType) {
        return fileType === this.config.get('IS_IMAGE')
    }

    async isValidFileDimensions(requestedFileDimension) {
        return this.config.get('FILE_SIZES').split(' ').includes(requestedFileDimension)
    }
}
