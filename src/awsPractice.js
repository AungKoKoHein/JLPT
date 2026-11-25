import bank from './awsPracticeBank.json' with { type: 'json' };
import keys from './awsAnswerKeys.json' with { type: 'json' };
export const awsPracticeTitle = bank.title;
// Preserve the previously reviewed explanation; every question now has a key.
const verifiedAnswers = {
  18: {
    answers: ['A', 'B'],
    explanation: 'S3 sends upload events to an SQS queue, which durably buffers the work. A Lambda event source mapping polls SQS and invokes the function. Successful processing removes the messages. This avoids a continuously running EC2 server and keeps processing independent of in-memory tracking. Lambda code should be idempotent because messages can be delivered more than once.',
    references: [
      { title: 'S3 event notification destinations', url: 'https://docs.aws.amazon.com/AmazonS3/latest/userguide/notification-how-to-event-types-and-destinations.html' },
      { title: 'Using Lambda with Amazon SQS', url: 'https://docs.aws.amazon.com/lambda/latest/dg/with-sqs.html' },
    ],
  },
};
export const awsQuestions = bank.questions.map(q => ({ ...q, ...keys.answers[q.number], ...verifiedAnswers[q.number] }));
export function toggleAwsAnswer(selected, letter, count) {
  if (selected.includes(letter)) return selected.filter(value => value !== letter);
  if (count === 1) return [letter];
  return selected.length < count ? [...selected, letter].sort() : selected;
}
export function awsAnswerStatus(question, selected, submitted) {
  if (!submitted) return 'Unchecked';
  if (!Array.isArray(question.answers)) return 'Ungraded';
  return selected.length === question.answers.length && question.answers.every(letter => selected.includes(letter)) ? 'Correct' : 'Review';
}
