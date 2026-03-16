import { Scan } from "./types";

// --- PARSER AUXILIAR ---
export const parseNmapResult = (scan: Scan) => {
  if (scan.status !== "COMPLETED" || !scan.result) return null;

  try {
    const nmapRun = scan.result?.nmaprun;
    const host = nmapRun?.host?.[0];

    if (!host) {
      return {
        ip: "Alvo não respondeu",
        openPorts: [],
      };
    }

    const ports = host.ports?.[0]?.port || [];
    const openPorts = ports.map((p: any) => ({
      port: p.$.portid,
      protocol: p.$.protocol,
      state: p.state?.[0]?.$.state,
      service: p.service?.[0]?.$.name || "unknown",
      product: p.service?.[0]?.$.product || "",
      version: p.service?.[0]?.$.version || "",
    }));

    return {
      ip: host.address?.[0]?.$.addr || "IP Desconhecido",
      openPorts,
    };
  } catch (e) {
    console.error("Erro ao parsear Nmap:", e);
    return null;
  }
};

// Parser para NIKTO (Web Scan)
export const parseNiktoResult = (scan: Scan) => {
  if (scan.status !== "COMPLETED" || !scan.result) return null;
  try {
    const vulns = scan.result.vulnerabilities || [];

    const cleanVulns = vulns.map((v: any) => ({
      id: v.id,
      method: v.method,
      url: v.url,
      msg: v.msg,
      osvdb: v.osvdb,
    }));

    return {
      host: scan.result.host,
      port: scan.result.port,
      banner: scan.result.banner,
      vulnerabilities: cleanVulns,
    };
  } catch (e) {
    return null;
  }
};
