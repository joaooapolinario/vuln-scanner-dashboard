import { Scan, NmapResult, NiktoResult } from "./types";
import { parseNiktoResult, parseNmapResult } from "./parsers";

export type SeverityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface UnifiedFinding {
  id: string;
  scanId: string;
  target: string;
  tool: "Nikto" | "Nmap";
  title: string;
  description: string;
  severity: SeverityLevel;
  url?: string;
  port?: string;
  method?: string;
  osvdb?: string;
  createdAt: string;
}

// Classificador inteligente de severidade baseado em regras heurísticas
export function classifySeverity(
  tool: "Nikto" | "Nmap",
  text: string,
  port?: string,
): SeverityLevel {
  const lower = text.toLowerCase();

  // Regras de Risco Crítico
  if (
    lower.includes("remote code execution") ||
    lower.includes("rce") ||
    lower.includes("sql injection") ||
    lower.includes("sqli") ||
    lower.includes("unauthenticated") ||
    lower.includes("arbitrary file") ||
    lower.includes("command injection") ||
    port === "23/tcp" || // Telnet puro sem criptografia
    port === "445/tcp" // SMB comumente explorado
  ) {
    return "CRITICAL";
  }

  // Regras de Risco Alto
  if (
    lower.includes("xss") ||
    lower.includes("cross site scripting") ||
    lower.includes("directory traversal") ||
    lower.includes("file inclusion") ||
    lower.includes("csrf") ||
    lower.includes("default password") ||
    lower.includes("backup file") ||
    lower.includes(".git") ||
    port === "3389/tcp" || // RDP exposto
    port === "3306/tcp" || // MySQL público
    port === "5432/tcp" || // PostgreSQL público
    port === "27017/tcp" // MongoDB público
  ) {
    return "HIGH";
  }

  // Regras de Risco Médio
  if (
    lower.includes("outdated") ||
    lower.includes("vulnerable") ||
    lower.includes("clickjacking") ||
    lower.includes("missing header") ||
    lower.includes("x-frame-options") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("certificate") ||
    port === "21/tcp" || // FTP
    port === "22/tcp" // SSH
  ) {
    return "MEDIUM";
  }

  // Regras de Risco Baixo
  if (
    lower.includes("header") ||
    lower.includes("banner") ||
    lower.includes("cookie") ||
    lower.includes("http method") ||
    lower.includes("options")
  ) {
    return "LOW";
  }

  return "INFO";
}

// Extrai e consolida todas as vulnerabilidades de todos os scans
export function extractAllFindings(scans: Scan[]): UnifiedFinding[] {
  const findings: UnifiedFinding[] = [];

  for (const scan of scans) {
    if (scan.status !== "COMPLETED" || !scan.result) continue;

    // Processamento de Scans Web (Nikto)
    if (scan.type === "WEB") {
      const parsedNikto: NiktoResult | null = parseNiktoResult(scan);
      if (parsedNikto?.vulnerabilities) {
        parsedNikto.vulnerabilities.forEach((v, index) => {
          findings.push({
            id: `${scan.id}-nikto-${v.id || index}`,
            scanId: scan.id,
            target: scan.target,
            tool: "Nikto",
            title: v.msg.length > 80 ? `${v.msg.slice(0, 80)}...` : v.msg,
            description: v.msg,
            severity: classifySeverity("Nikto", v.msg),
            url: v.url && v.url !== "/" ? v.url : undefined,
            method: v.method,
            osvdb: v.osvdb !== "0" ? v.osvdb : undefined,
            createdAt: scan.createdAt,
          });
        });
      }
    }

    // Processamento de Scans de Infraestrutura (Nmap)
    if (scan.type === "NETWORK" || !scan.type) {
      const parsedNmap: NmapResult | null = parseNmapResult(scan);
      if (parsedNmap?.openPorts) {
        parsedNmap.openPorts.forEach((p, index) => {
          const portId = `${p.port}/${p.protocol}`;
          const serviceDesc = `${p.service} ${p.product} ${p.version}`.trim();
          const desc = `Porta ${portId} aberta executando serviço: ${serviceDesc || "Desconhecido"}`;
          
          findings.push({
            id: `${scan.id}-nmap-${index}`,
            scanId: scan.id,
            target: scan.target,
            tool: "Nmap",
            title: `Porta Aberta: ${portId} (${p.service})`,
            description: desc,
            severity: classifySeverity("Nmap", desc, portId),
            port: portId,
            createdAt: scan.createdAt,
          });
        });
      }
    }
  }

  // Ordena por severidade (CRITICAL > HIGH > MEDIUM > LOW > INFO) e depois por data
  const severityWeight: Record<SeverityLevel, number> = {
    CRITICAL: 5,
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    INFO: 1,
  };

  return findings.sort((a, b) => {
    const diff = severityWeight[b.severity] - severityWeight[a.severity];
    if (diff !== 0) return diff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// Utilitário para download de JSON
export function exportToJson(filename: string, data: unknown) {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Utilitário para download de CSV
export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][],
) {
  const escapeCsv = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) => row.map(escapeCsv).join(",")),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
