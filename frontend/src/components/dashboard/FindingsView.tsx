"use client";

import { useState, useMemo } from "react";
import { Scan } from "@/lib/types";
import {
  extractAllFindings,
  exportToCsv,
  exportToJson,
  UnifiedFinding,
  SeverityLevel,
} from "@/lib/findings";
import {
  ShieldAlert,
  Flame,
  AlertCircle,
  Target,
  Search,
  SlidersHorizontal,
  Download,
  FileSpreadsheet,
  FileCode,
  Globe,
  Server,
  Filter,
} from "lucide-react";
import { AiRemediation } from "@/components/AiRemediation";
import { Badge } from "@/components/ui/badge";

interface FindingsViewProps {
  scans: Scan[];
}

export function FindingsView({ scans }: FindingsViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [toolFilter, setToolFilter] = useState<string>("ALL");
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Extrai todas as vulnerabilidades dos scans de forma memoizada
  const allFindings = useMemo(() => extractAllFindings(scans), [scans]);

  // Estatísticas de Vulnerabilidades
  const stats = useMemo(() => {
    const criticalAndHigh = allFindings.filter(
      (f) => f.severity === "CRITICAL" || f.severity === "HIGH",
    ).length;
    const medium = allFindings.filter((f) => f.severity === "MEDIUM").length;
    const uniqueTargets = new Set(allFindings.map((f) => f.target)).size;

    return {
      total: allFindings.length,
      criticalAndHigh,
      medium,
      uniqueTargets,
    };
  }, [allFindings]);

  // Filtragem
  const filteredFindings = useMemo(() => {
    return allFindings.filter((f) => {
      const matchesSearch =
        f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.url && f.url.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.port && f.port.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesSeverity =
        severityFilter === "ALL" || f.severity === severityFilter;

      const matchesTool = toolFilter === "ALL" || f.tool === toolFilter;

      return matchesSearch && matchesSeverity && matchesTool;
    });
  }, [allFindings, searchTerm, severityFilter, toolFilter]);

  // Exportadores
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Alvo",
      "Ferramenta",
      "Severidade",
      "Título",
      "Descrição",
      "URL/Porta",
      "Data",
    ];
    const rows = filteredFindings.map((f) => [
      f.id,
      f.target,
      f.tool,
      f.severity,
      f.title,
      f.description,
      f.url || f.port || "-",
      f.createdAt,
    ]);
    exportToCsv("vulnscanner-findings", headers, rows);
    setIsExportMenuOpen(false);
  };

  const handleExportJson = () => {
    exportToJson("vulnscanner-findings", filteredFindings);
    setIsExportMenuOpen(false);
  };

  const getSeverityBadge = (severity: SeverityLevel) => {
    switch (severity) {
      case "CRITICAL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            CRÍTICA
          </span>
        );
      case "HIGH":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
            ALTA
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            MÉDIA
          </span>
        );
      case "LOW":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
            BAIXA
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            INFO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Central de Vulnerabilidades & Ameaças
          </h1>
          <p className="text-sm text-muted-foreground">
            Inventário consolidado de falhas de segurança e exposição de rede
          </p>
        </div>

        {/* Export Button with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a1a21]/80 border border-white/10 hover:border-primary/50 text-sm font-semibold text-foreground hover:text-primary transition-all shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Relatório</span>
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-0 top-11 mt-1 w-48 rounded-xl bg-[#1c1c22] border border-white/10 p-2 shadow-2xl z-40 space-y-1">
              <button
                onClick={handleExportCsv}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                <span>Exportar como CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-foreground hover:bg-white/5 rounded-lg transition-colors text-left"
              >
                <FileCode className="h-4 w-4 text-blue-400" />
                <span>Exportar como JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Total de Descobertas
            </span>
            <div className="text-2xl font-bold text-foreground mt-1">
              {stats.total}
            </div>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-xl border border-primary/20">
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Críticas / Altas
            </span>
            <div className="text-2xl font-bold text-red-400 mt-1">
              {stats.criticalAndHigh}
            </div>
          </div>
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20">
            <Flame className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Médio Impacto
            </span>
            <div className="text-2xl font-bold text-yellow-400 mt-1">
              {stats.medium}
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
            <AlertCircle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground uppercase font-medium">
              Alvos Afetados
            </span>
            <div className="text-2xl font-bold text-blue-400 mt-1">
              {stats.uniqueTargets}
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <Target className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por falha, URL, porta ou alvo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#15151a] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#15151a] border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none"
          >
            <option value="ALL">Todas as Severidades</option>
            <option value="CRITICAL">Crítica</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
            <option value="INFO">Informativa</option>
          </select>

          <select
            value={toolFilter}
            onChange={(e) => setToolFilter(e.target.value)}
            className="bg-[#15151a] border border-white/10 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none"
          >
            <option value="ALL">Todos os Motores</option>
            <option value="Nikto">Web (Nikto)</option>
            <option value="Nmap">Infra (Nmap)</option>
          </select>

          {(severityFilter !== "ALL" ||
            toolFilter !== "ALL" ||
            searchTerm !== "") && (
            <button
              onClick={() => {
                setSeverityFilter("ALL");
                setToolFilter("ALL");
                setSearchTerm("");
              }}
              className="text-xs text-primary hover:underline px-2"
            >
              Resetar
            </button>
          )}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-3">
        {filteredFindings.length === 0 ? (
          <div className="bg-[#1a1a21]/30 border border-white/5 rounded-2xl p-12 text-center text-muted-foreground">
            <ShieldAlert className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-base font-medium text-foreground">
              Nenhuma vulnerabilidade encontrada
            </p>
            <p className="text-xs mt-1">
              Tente ajustar seus termos de busca ou filtros acima.
            </p>
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <div
              key={finding.id}
              className="bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-5 hover:border-white/15 transition-all shadow-md space-y-3 group"
            >
              {/* Header of Finding */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge(finding.severity)}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-foreground font-semibold">
                    {finding.target}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    {finding.tool === "Nikto" ? (
                      <Globe className="h-3 w-3 text-orange-400" />
                    ) : (
                      <Server className="h-3 w-3 text-blue-400" />
                    )}
                    {finding.tool}
                  </span>
                  {finding.method && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                      {finding.method}
                    </span>
                  )}
                  {finding.osvdb && (
                    <span className="text-[10px] font-mono text-muted-foreground">
                      OSVDB: {finding.osvdb}
                    </span>
                  )}
                </div>

                <span className="text-[11px] font-mono text-muted-foreground">
                  ID: {finding.scanId.slice(0, 8)}...
                </span>
              </div>

              {/* Title & Description */}
              <div>
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {finding.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {finding.description}
                </p>
              </div>

              {/* URL or Port Context */}
              {finding.url && (
                <div className="bg-[#15151a] p-2 rounded-lg border border-white/5 flex items-center gap-2 overflow-x-auto text-xs font-mono text-blue-400">
                  <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span>{finding.url}</span>
                </div>
              )}

              {/* AI Remediation */}
              <div className="pt-1">
                <AiRemediation
                  tool={`${finding.tool} Scan`}
                  finding={finding.description}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
