# s3-upload-resized-nest-js
Using Node.js (ideally Nest.js), create a service that accepts files using HTTP protocol and uploads them to AWS S3. If the received file is an image, then the image must be resized to the specified size before being sent to S3.   

The original image doesn’t need to be saved. There can be several sizes (large - 2048x2048, medium - 1024x1024, thumb - 300x300). The dimensions are the maximum allowable values for the width and height.

Notes:

- the service must serve only one endpoint: a request /{filename}; 

- do not use multipart/form-data (the request headers will contain Content-Type: for example, Content-Type: image/png); 

- the amount of RAM consumed by the service should not be related to the size of the uploaded file; 

- service should be configurable using environment variables; 

- it is mandatory to provide the ability to specify valid extensions and valid file types (Content-Type) (all other files must be rejected by the service); 

- it is mandatory to provide the ability to specify the maximum file size;
