

export class UploadFileResponse{
     public getImageSizeError(imageSize){
       return `Request parameter imageSize => (${imageSize}) is not valid, it must be (large, medium or thumb)`
    }
    
}