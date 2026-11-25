export const awsPracticeTitle = 'AWS Certified Solutions Architect Associate SAA-C03 (1).pdf';

// One sample from PDF page 7. The source PDF has no answer key;
// this sample answer is checked against the linked AWS documentation.
export const awsPracticeSample = {
  id: 'aws-saa-c03-18', number: 18, topic: 'Topic 1', sourcePage: 7,
  prompt: [
    'An application development team is designing a microservice that will convert large images to smaller, compressed images. When a user uploads an image through the web interface, the microservice should store the image in an Amazon S3 bucket, process and compress the image with an AWS Lambda function, and store the image in its compressed form in a different S3 bucket.',
    'A solutions architect needs to design a solution that uses durable, stateless components to process the images automatically.',
    'Which combination of actions will meet these requirements? (Choose two.)',
  ],
  choices: [
    'Create an Amazon Simple Queue Service (Amazon SQS) queue. Configure the S3 bucket to send a notification to the SQS queue when an image is uploaded to the S3 bucket.',
    'Configure the Lambda function to use the Amazon Simple Queue Service (Amazon SQS) queue as the invocation source. When the SQS message is successfully processed, delete the message in the queue.',
    'Configure the Lambda function to monitor the S3 bucket for new uploads. When an uploaded image is detected, write the file name to a text file in memory and use the text file to keep track of the images that were processed.',
    'Launch an Amazon EC2 instance to monitor an Amazon Simple Queue Service (Amazon SQS) queue. When items are added to the queue, log the file name in a text file on the EC2 instance and invoke the Lambda function.',
    "Configure an Amazon EventBridge (Amazon CloudWatch Events) event to monitor the S3 bucket. When an image is uploaded, send an alert to an Amazon ample Notification Service (Amazon SNS) topic with the application owner's email address for further processing.",
  ],
  selectCount: 2, answers: ['A', 'B'],
  explanation: 'S3 sends upload events to an SQS queue, which durably buffers the work. A Lambda event source mapping polls SQS and invokes the function. Successful processing removes the messages. This avoids a continuously running EC2 server and keeps processing independent of in-memory tracking. Lambda code should be idempotent because messages can be delivered more than once.',
  references: [
    { title: 'S3 event notification destinations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html' },
    { title: 'Using Lambda with Amazon SQS', url: 'https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html' },
  ],
};
