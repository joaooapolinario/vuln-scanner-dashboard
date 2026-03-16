export interface Scan {
  id: string;
  target: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  result: any;
  logs?: string;
  type: "NETWORK" | "WEB";
}

export interface DashboardStats {
  totalScans: number;
  uniqueTargets: number;
  topPorts: { port: string; count: number }[];
}
