import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

// const snsClient = new SNSClient({ region: process.env.AWS_REGION });
// const TopicArn = process.env.TopicArn;

export class RideTopic {
  constructor(
    private topicArn: string | undefined,
    private snsClient: SNSClient
  ) {}

  async sendSNS(Message: object) {
    // Send to SNS
    try {
      const result = await this.snsClient.send(
        new PublishCommand({
          Message: JSON.stringify(Message),
          TopicArn: this.topicArn,
        })
      );
      console.log("SNS result: ", result);
    } catch (err: unknown) {
      console.error(err, (err as Error).stack);
    }
  }
}
