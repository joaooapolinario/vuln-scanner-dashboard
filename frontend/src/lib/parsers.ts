import {
  Scan,
  NmapResult,
  NiktoResult,
  NmapPort,
  NiktoVulnerability,
} from "./types";

interface NmapRawPort {
  $: { portid: string; protocol: string };
  state?: Array<{ $: { state: string } }>;
  service?: Array<{ $: { name?: string; product?: string; version?: string } }>;
}

interface NmapRawHost {
  address?: Array<{ $: { addr: string } }>;
  ports?: Array<{ port?: NmapRawPort[] }>;
}

interface NmapRawRun {
  nmaprun?: {
    host?: NmapRawHost[];
  };
}

interface NiktoRawResult {
  host: string;
  port?: string;
  banner?: string;
  vulnerabilities?: NiktoVulnerability[];
}

// --- PARSER AUXILIAR NMAP ---
export const parseNmapResult = (scan: Scan): NmapResult | null => {
  if (scan.status !== "COMPLETED" || !scan.result) return null;

  try {
    const rawResult = scan.result as NmapRawRun;
    const host = rawResult?.nmaprun?.host?.[0];

    if (!host) {
      return {
        ip: "Alvo não respondeu",
        openPorts: [],
      };
    }

    const rawPorts = host.ports?.[0]?.port || [];
    const openPorts: NmapPort[] = rawPorts.map((p: NmapRawPort) => ({
      port: p.$?.portid || "0",
      protocol: p.$?.protocol || "tcp",
      state: p.state?.[0]?.$?.state || "unknown",
      service: p.service?.[0]?.$?.name || "unknown",
      product: p.service?.[0]?.$?.product || "",
      version: p.service?.[0]?.$?.version || "",
    }));

    return {
      ip: host.address?.[0]?.$?.addr || "IP Desconhecido",
      openPorts,
    };
  } catch (e) {
    console.error("Erro ao parsear Nmap:", e);
    return null;
  }
};

// --- PARSER AUXILIAR NIKTO (Web Scan) ---
export const parseNiktoResult = (scan: Scan): NiktoResult | null => {
  if (scan.status !== "COMPLETED" || !scan.result) return null;

  try {
    const raw = scan.result as NiktoRawResult;
    const vulns = raw.vulnerabilities || [];

    const cleanVulns: NiktoVulnerability[] = vulns.map(
      (v: NiktoVulnerability) => ({
        id: v.id || "0",
        method: v.method || "UNKNOWN",
        url: v.url || "/",
        msg: v.msg || "Sem descrição",
        osvdb: v.osvdb || "0",
      }),
    );

    return {
      host: raw.host || scan.target,
      port: raw.port,
      banner: raw.banner || "Banner não detectado",
      vulnerabilities: cleanVulns,
    };
  } catch {
    return null;
  }
};
