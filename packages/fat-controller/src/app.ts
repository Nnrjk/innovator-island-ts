import { Context, EventBridgeEvent } from "aws-lambda";
import { RideDB } from "./ddb";
import { Ride, RideMessage } from "./domain";
import { RideTopic } from "./sns";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { SNSClient } from "@aws-sdk/client-sns";

export class FatController {
  private rideDB: RideDB;
  private rideTopic: RideTopic;

  constructor(
    private props: {
      tableName?: string;
      dynamoDBClient: DynamoDBClient;
      topicArn?: string;
      snsClient: SNSClient;
    }
  ) {
    this.rideDB = new RideDB(props.tableName, props.dynamoDBClient);
    this.rideTopic = new RideTopic(props.topicArn, props.snsClient);
  }

  async publishRideState(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: EventBridgeEvent<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: Context
  ) {
    const rides = await this.rideDB.getRides();
    const ridesMessages: RideMessage[] = [];

    await Promise.all(
      rides.map(async (ride: Ride): Promise<void> => {
        const updatedRide = this.updateRideState(ride);
        await this.rideDB.updateRide(updatedRide);

        ridesMessages.push({
          rideId: ride.ID,
          inService: ride.inService,
          wait: ride.wait,
          lastUpdated: ride.lastUpdated,
        });
      })
    );

    // Push new ride times to messaging table
    await this.rideTopic.sendSNS({
      type: "summary",
      msg: JSON.stringify(ridesMessages),
    });
  }

  /**
   * Simple algorithm to change ride times every minute and randomly close rides.
   */
  updateRideState(ride: Ride): Ride {
    if (ride.wait === 0) {
      ride.inService = true;
    }

    // Maintenance/closure of ride
    if (ride.inService) {
      if (Math.random() < ride.closureProbability) {
        ride.inService = false;
        ride.wait = 5 * ride.waitChangeRate;
        ride.targetWait = 0;
        console.log(`${ride.ID}: Closure on ride`);
        return ride;
      }
    }

    // If current wait is current target wait, set new targetWait
    if (ride.wait === ride.targetWait) {
      ride.targetWait = Math.floor(Math.random() * ride.maxWait);
      console.log(`${ride.ID}: New target wait: ${ride.targetWait}`);
    }

    // Move wait towards targetWait
    if (ride.wait < ride.targetWait) {
      ride.wait += ride.waitChangeRate;
      ride.wait = Math.min(ride.wait, ride.targetWait);
    } else {
      ride.wait -= ride.waitChangeRate;
      ride.wait = Math.max(ride.wait, ride.targetWait);
    }
    return ride;
  }
}

const fatController = new FatController({
  tableName: process.env.DDBtable,
  dynamoDBClient: new DynamoDBClient({ region: process.env.AWS_REGION }),
  topicArn: process.env.TopicArn,
  snsClient: new SNSClient({ region: process.env.AWS_REGION }),
});
export const lambdaHandler = fatController.publishRideState.bind(fatController);
