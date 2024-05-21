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
