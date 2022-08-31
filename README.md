# s3-upload-resized-nest-js
Using Node.js (ideally Nest.js), create a service that accepts files using HTTP protocol and uploads them to AWS S3. If the received file is an image, then the image must be resized to the specified size before being sent to S3.   

The original image doesn’t need to be saved. There can be several sizes (large - 2048x2048, medium - 1024x1024, thumb - 300x300). The dimensions are the maximum allowable values for the width and height.
