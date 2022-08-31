import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import * as AWS from 'aws-sdk';
import * as Sharp from 'sharp';

@Injectable()
export class UploadService {
  constructor(private config: ConfigService) {}

  S3 = new AWS.S3({
    region: 'us-east-2',
    accessKeyId: this.config.get('AWS_S3_ACCESS_KEY_ID'),
    secretAccessKey: this.config.get('AWS_S3_ACCESS_KEY_SECRET'),
  });

  async fileHandler(bodyObj, fileObj) {
    let isValidExtentionFlag = false,
      isValidSizeFlag = false,
      isImageFlag = false;

    if (fileObj) {
      isValidExtentionFlag = await this.isValidFileExtentions(
        fileObj.mimetype.split('/')[1],
      );
      isValidSizeFlag = await this.isValidFileSize(fileObj.size);
      isImageFlag = await this.isImage(fileObj.mimetype.split('/')[0]);
    } else {
      return { status: false, message: 'File not attached', data: {} };
    }

    if (!isValidExtentionFlag) {
      return {
        status: false,
        message: `File with (${
          fileObj.mimetype.split('/')[1]
        }) extention is not allowed`,
        data: {},
      };
    }

    if (!isValidSizeFlag)
      return {
        status: false,
        message: `File size ${fileObj.size} kb is too large`,
        data: {},
      };

    if (isImageFlag) {
      // Resizing Image:
      let validDimesionFlag = await this.isValidFileDimensions(
        bodyObj.imageSize,
      );

      if (!validDimesionFlag)
        return {
          status: false,
          message: `Request parameter imageSize => (${bodyObj.imageSize}) is not valid, it must be (large, medium or thumb)`,
          data: {},
        };

      let width = '',
        height = '';

      const dir = './uploads';
      if (!existsSync(dir)) mkdirSync(dir);

      const outputDir = join(
        process.cwd(),
        './uploads/' + fileObj.originalname,
      );

      if (bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[0]) {
        width = this.config.get('LARGE_IMAGE_WIDTH');
        height = this.config.get('LARGE_IMAGE_HEIGHT');
      } else if (
        bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[1]
      ) {
        width = this.config.get('MEDIUM_IMAGE_WIDTH');
        height = this.config.get('MEDIUM_IMAGE_HEIGHT');
      } else if (
        bodyObj.imageSize === this.config.get('FILE_SIZES').split(' ')[2]
      ) {
        width = this.config.get('THUMBNAIL_IMAGE_WIDTH');
        height = this.config.get('THUMBNAIL_IMAGE_HEIGHT');
      }

      try {
        await Sharp(fileObj.buffer)
          .resize(parseInt(width), parseInt(height))
          .toFile(outputDir);

        const ResizedImagebuffer = readFileSync(outputDir);

        return await this.uploadOnS3Bucket({
          originalname: fileObj.originalname,
          buffer: ResizedImagebuffer,
          mimetype: fileObj.mimetype,
        });
      } catch (e) {
        return {
          status: false,
          message: 'Internal Server Error',
          data: e.message,
        };
      }
    } else {
      return await this.uploadOnS3Bucket(fileObj);
    }
  }

  async uploadOnS3Bucket(fileObj) {
    const { originalname, buffer, mimetype } = fileObj;
    const params = {
      Bucket: this.config.get('AWS_S3_BUCKET_NAME'),
      Key: originalname,
      Body: buffer,
      ACL: 'public-read',
      ContentType: mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-2',
      },
    };
    try {
      let s3Response = await this.S3.upload(params).promise();
      return {
        status: true,
        message: 'File Uploaded to S3',
        data: s3Response,
      };
    } catch (e) {
      return { status: false, message: 'Internal Server Error', data: e };
    }
  }

  async isValidFileExtentions(fileExtention) {
    return await this.config
      .get('VALID_FILE_EXTENSIONS')
      .split(' ')
      .includes(fileExtention);
  }

  async isValidFileSize(fileSize) {
    return parseInt(fileSize) < this.config.get('MAX_FILE_SIZE_IN_KB');
  }

  async isImage(fileType) {
    return fileType === this.config.get('IS_IMAGE');
  }

  async isValidFileDimensions(requestedFileDimension) {
    return this.config
      .get('FILE_SIZES')
      .split(' ')
      .includes(requestedFileDimension);
  }
}
