export type Ride = {
  ID: string;
  inService: boolean;
  wait: number;
  lastUpdated: number;
  closureProbability: number;
  waitChangeRate: number;
  targetWait: number;
  maxWait: number;
};

export type RideMessage = {
  rideId: string;
  inService: boolean;
  wait: number;
  lastUpdated: number;
};
