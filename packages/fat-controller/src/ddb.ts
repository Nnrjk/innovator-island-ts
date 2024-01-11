import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";
import { Ride } from "./domain";

export class RideDB {
  private documentClient;

  constructor(private tableName: string | undefined, client: DynamoDBClient) {
    this.documentClient = DynamoDBDocumentClient.from(client);
  }

  async getRides(): Promise<Ride[]> {
    const result: ScanCommandOutput = await this.documentClient.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    return (result.Items ?? []) as Ride[];
  }

  // Updates ride in the table
  async updateRide(ride: { lastUpdated: number }) {
    ride.lastUpdated = Date.now();
    console.log("ride" + JSON.stringify(ride));

    await this.documentClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: ride,
      })
    );
  }
}
