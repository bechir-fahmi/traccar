import { v4 } from "uuid";
export type Position = {
  accuracy: number;
  address: string | null;
  altitude: number;
  attributes: {
    sat?: number;
    ignition?: boolean;
    status?: number;
    charge?: boolean;
    blocked?: boolean;
    alarm?: string;
    batteryLevel?: number;
    rssi?: number;
    distance?: number;
    motion?: boolean;
    totalDistance?: number;
  };
  alarm: string;
  blocked: boolean;
  charge: boolean;
  sat: number;
  status: number;
  course: number;
  deviceId: number;
  deviceTime: string; //use this for comparison
  fixTime: string; //This work too
  geofenceIds: null | number[];
  id: number;
  latitude: number;
  longitude: number;
  network: {
    radioType: string;
    considerIp: boolean;
    cellTowers: [
      {
        cellId: number;
        locationAreaCode: number;
        mobileCountryCode: number;
        mobileNetworkCode: number;
      }
    ];
  } | null;

  considerIp: boolean;
  radioType: string;
  outdated: boolean;
  protocol: string;
  serverTime: string;
  speed: number;
  valid: boolean;
};
export function findTourReturns(tour: Position[]) {
  let returns: Position[] = [];

  for (let i = 0; i < tour.length - 1; i++) {
    const currentPos = tour[i];
    const nextPos = tour[i + 1];

    // Check if the current position is included in the next positions
    const isReturn =
      currentPos.longitude === nextPos.longitude &&
      currentPos.latitude === nextPos.latitude &&
      currentPos.speed > 0;

    // Check for a return event (speed increases from 0 to a positive value and current position is included in next positions)
    if (isReturn) {
      returns.push(currentPos);
    }
  }

  // Convert returns to the desired format
  return returns.map((parking) => ({
    id: parking.id,
    longitude: parking.longitude,
    latitude: parking.latitude,
    deviceTime: new Date(parking.deviceTime).toLocaleString(),
    speed: parking.speed,
    type: "RETURN",
  }));
}

export function findTourHistory(parkings: any, returns: any) {
  // Combine parkings and returns arrays
  const history = [...parkings, ...returns];

  // Sort the history array by deviceTime
  const sorted = history.sort(
    (a, b) =>
      new Date(a.deviceTime).getTime() - new Date(b.deviceTime).getTime()
  );

  // Convert history to the desired format
  return sorted.map((event) => ({
    id: event.id,
    longitude: event.longitude,
    latitude: event.latitude,
    deviceTime: event.deviceTime,
    speed: event.speed,
    type: parkings.includes(event) ? "parking" : "return",
    duration: event.durationInMunites, // Add type field to distinguish parkings and returns
  }));
}
export default function findTourParkings(tour: Position[]) {
  let parkings: { position: Position; duration: number }[] = [];
  let parkingStartTime: number | null = null;

  for (let i = 0; i < tour.length - 1; i++) {
    if (tour[i].speed === 0 || tour[i].attributes.motion === false) {
      if (parkingStartTime === null) {
        parkingStartTime = new Date(tour[i].deviceTime).getTime();
      }
    } else if (parkingStartTime !== null) {
      const parkingEndTime = new Date(tour[i].deviceTime).getTime();
      const parkingDuration = parkingEndTime - parkingStartTime;
      parkings.push({ position: tour[i - 1], duration: parkingDuration });
      parkingStartTime = null;
    }
  }

  /*console.table(
    embedInterpolatedPositions(tour, 5).map((pos) => ({
      id: pos.id,
      lon: pos.longitude,
      lat: pos.latitude,
    }))
  );
*/
  return parkings
    .filter((i) => i.duration / (1000 * 60) > 4)
    .map((parking) => ({
      id: parking.position.id,
      longitude: parking.position.longitude,
      latitude: parking.position.latitude,
      deviceTime: new Date(parking.position.deviceTime).toLocaleString(),
      speed: parking.position.speed,
      durationInMunites: parking.duration / (1000 * 60),
    }));
}

export function splineInterpolation(positions: Position[], numPoints) {
  // Extract latitude and longitude arrays from positions
  const lats = positions.map((pos) => pos.latitude);
  const lngs = positions.map((pos) => pos.longitude);
  console.log({ lats, lngs });
  // Create spline functions for latitude and longitude
  const splineLat = curveNatural(lats);
  const splineLng = curveNatural(lngs);

  // Interpolate numPoints points along the spline curve
  const interpolatedPositions = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1); // t parameter varies from 0 to 1
    const lat = splineLat(t);
    const lng = splineLng(t);
    interpolatedPositions.push({ latitude: lat, longitude: lng, id: v4() });
  }

  return interpolatedPositions;
}

export function curveNatural(points: number[]): (t: number) => number {
  const n = points.length - 1;

  // Compute second derivatives (slopes) at each point
  const dx = [];
  const dy = [];
  const slope = [];

  for (let i = 0; i < n; i++) {
    dx.push(i + 1 - i);
    dy.push(points[i + 1] - points[i]);
    slope.push(dy[i] / dx[i]);
  }

  const a = [];
  const b = [];
  const c = [];
  const d = [];

  for (let i = 0; i < n; i++) {
    a.push(points[i]);
    b.push(slope[i]);
    c.push(((3 * dy[i]) / dx[i] - 2 * slope[i] - slope[i + 1]) / dx[i]);
    d.push((slope[i + 1] + slope[i] - (2 * dy[i]) / dx[i]) / dx[i] ** 2);
  }

  // Interpolation function
  return function (t) {
    const i = Math.min(Math.max(0, Math.floor(t * n)), n - 1);
    const dt = t * n - i;
    return a[i] + b[i] * dt + c[i] * dt ** 2 + d[i] * dt ** 3;
  };
}

export function embedInterpolatedPositions(
  originalTour: Position[],
  numPoints: number
) {
  const interpolatedTour = [];

  for (let i = 0; i < originalTour.length - 1; i++) {
    const currentPosition = originalTour[i];
    const nextPosition = originalTour[i + 1];

    interpolatedTour.push(currentPosition);

    // Check for significant speed variation between consecutive points
    if (Math.abs(currentPosition.speed - nextPosition.speed) > 5) {
      console.log([currentPosition, nextPosition]);
      // Interpolate points between current and next positions
      const interpolatedPoints = splineInterpolation(
        [currentPosition, nextPosition],
        numPoints
      );

      interpolatedTour.push(...interpolatedPoints);
    }
  }

  // Add the last position of the tour
  interpolatedTour.push(originalTour[originalTour.length - 1]);

  return interpolatedTour;
}
