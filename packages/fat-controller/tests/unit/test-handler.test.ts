import { Context, EventBridgeEvent } from "aws-lambda";
import { FatController } from "../../src/app";
import { mockClient } from "aws-sdk-client-mock";
import { beforeAll, describe, it } from "@jest/globals";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

describe("Unit test for app handler", function () {
  beforeAll(async () => {
    const dynamoDBClientMock = mockClient(DynamoDBDocumentClient);
    dynamoDBClientMock.on(ScanCommand).resolves({
      $metadata: {},
      Items: [
        {
          ID: "id1",
          inService: true,
          wait: 5,
          lastUpdated: 10,
          closureProbability: 0.5,
          waitChangeRate: 2,
          targetWait: 3,
          maxWait: 6,
        },
        {
          ID: "id2",
          inService: false,
          wait: 5,
          lastUpdated: 10,
          closureProbability: 0.5,
          waitChangeRate: 2,
          targetWait: 3,
          maxWait: 6,
        },
      ],
    });
    dynamoDBClientMock.on(PutCommand).resolves({ $metadata: {} });

    const snsClientMock = mockClient(SNSClient);
    snsClientMock.on(PublishCommand).resolves({ $metadata: {} });
  });

  it("verifies successful response", async () => {
    const payload: EventBridgeEvent<string, unknown> = {
      id: "cdc73f9d-aea9-11e3-9d5a-835b769c0d9c",
      version: "1",
      "detail-type": "Scheduled Event",
      source: "aws.events",
      account: "",
      time: "1970-01-01T00:00:00Z",
      region: "us-west-2",
      resources: ["arn:aws:events:us-west-2:123456789012:rule/ExampleRule"],
      detail: {},
    };

    const region = "eu-central-1";
    const fatController = new FatController({
      tableName: "DDBtable",
      dynamoDBClient: new DynamoDBClient({ region }),
      topicArn: "FATcontroller",
      snsClient: new SNSClient({ region }),
    });
    await fatController.publishRideState(payload, {} as Context);
  });
});
