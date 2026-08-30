export type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type ScanType = "NETWORK" | "WEB";

export interface NmapPort {
  port: string;
  protocol: string;
  state: string;
  service: string;
  product: string;
  version: string;
}

export interface NmapResult {
  ip: string;
  openPorts: NmapPort[];
}

export interface NiktoVulnerability {
  id: string;
  method: string;
  url: string;
  msg: string;
  osvdb: string;
}

export interface NiktoResult {
  host: string;
  port?: string;
  ip?: string;
  banner: string;
  vulnerabilities: NiktoVulnerability[];
}

export interface ScanSummary {
  openPorts?: string[];
}

export interface Scan<TResult = unknown> {
  id: string;
  target: string;
  status: ScanStatus;
  type: ScanType;
  result?: TResult | null;
  summary?: ScanSummary | null;
  logs?: string | null;
  createdAt: string;
  finishedAt?: string | null;
  userId?: string;
}

export interface DashboardStats {
  totalScans: number;
  uniqueTargets: number;
  topPorts: { port: string; count: number }[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}
