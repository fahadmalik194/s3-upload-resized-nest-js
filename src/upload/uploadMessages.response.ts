export class UploadFileResponse {
    public getNoFileAttachedError() {
        return 'File not attached'
    }
    public getInValidExtentionError(fileExtention: string) {
        return `File with (${fileExtention}) extention is not allowed`
    }
    public getInValidFileSizeError(fileSize: number) {
        return `File size ${fileSize} kb is too large`
    }
    public getImageSizeError(imageSize: string) {
        return `Request parameter imageSize => (${imageSize}) is not valid, it must be (large, medium or thumb)`
    }
}
