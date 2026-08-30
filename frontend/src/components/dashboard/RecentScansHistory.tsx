"use client";

import { useState, useMemo } from "react";
import { Scan, ScanStatus, ScanType } from "@/lib/types";
import { ScanReportDialog } from "./ScanReportDialog";
import {
  Search,
  SlidersHorizontal,
  Cloud,
  Server,
  Trash2,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/api";
import { useAuth } from "@/context/auth-context";

interface RecentScansHistoryProps {
  scans: Scan[];
  selectedScan: Scan | null;
  setSelectedScan: (scan: Scan | null) => void;
  onRefresh?: () => void;
}

export function RecentScansHistory({
  scans,
  selectedScan,
  setSelectedScan,
  onRefresh,
}: RecentScansHistoryProps) {
  const { token } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtragem dinâmica e em tempo real
  const filteredScans = useMemo(() => {
    return scans.filter((scan) => {
      // Busca textual
      const matchesSearch =
        scan.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.id.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus =
        statusFilter === "ALL" || scan.status === statusFilter;

      // Filtro de tipo
      const matchesType = typeFilter === "ALL" || scan.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [scans, searchTerm, statusFilter, typeFilter]);

  // Gestão de seleção múltipla
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredScans.map((s) => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Exclusão individual
  const handleDeleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Deseja realmente remover esta varredura do histórico?")) return;

    try {
      setIsDeleting(true);
      await fetchWithAuth(`/scans/${id}`, token, {
        method: "DELETE",
      });
      if (selectedScan?.id === id) {
        setSelectedScan(null);
      }
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir varredura");
    } finally {
      setIsDeleting(false);
    }
  };

  // Exclusão em lote
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (
      !confirm(
        `Deseja realmente excluir ${selectedIds.size} varredura(s) selecionada(s)?`,
      )
    )
      return;

    try {
      setIsDeleting(true);
      await fetchWithAuth("/scans/bulk-delete", token, {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      setSelectedIds(new Set());
      if (selectedScan && selectedIds.has(selectedScan.id)) {
        setSelectedScan(null);
      }
      onRefresh?.();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir varreduras");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusDisplay = (status: ScanStatus) => {
    switch (status) {
      case "COMPLETED":
        return {
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
          color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          label: "Concluído",
        };
      case "FAILED":
        return {
          icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
          color: "text-red-400 bg-red-500/10 border-red-500/20",
          label: "Falhou",
        };
      case "PROCESSING":
        return {
          icon: <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />,
          color: "text-blue-400 bg-blue-500/10 border-blue-500/20",
          label: "Varrendo",
        };
      default:
        return {
          icon: <Clock className="h-3.5 w-3.5 text-yellow-400" />,
          color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
          label: "Pendente",
        };
    }
  };

  // Cálculo de Score Determinístico (sem números aleatórios)
  const calculateScanScore = (scan: Scan) => {
    if (scan.status === "FAILED") return 0;
    if (scan.status === "PROCESSING" || scan.status === "PENDING") return 50;
    const openPorts = scan.summary?.openPorts?.length || 0;
    return Math.max(10, 100 - openPorts * 15);
  };

  const isAllSelected =
    filteredScans.length > 0 && selectedIds.size === filteredScans.length;

  return (
    <div className="col-span-12 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-xl">
      {/* Header section */}
      <div className="p-4 sm:p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground">
              Superfície de Ataque & Histórico
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredScans.length} de {scans.length} varreduras listadas
            </p>
          </div>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir ({selectedIds.size})</span>
            </button>
          )}
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar alvo ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#15151a] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 w-full transition-colors"
            />
          </div>

          {/* Filter Popover */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 rounded-full border transition-colors ${
                statusFilter !== "ALL" || typeFilter !== "ALL"
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-[#15151a] border-white/10 text-muted-foreground hover:text-foreground"
              }`}
              title="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-10 mt-2 w-56 rounded-xl bg-[#1c1c22] border border-white/10 p-3 shadow-2xl z-40 space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1.5">
                    <Filter className="h-3 w-3 text-primary" /> Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-[#15151a] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">Todos os Status</option>
                    <option value="COMPLETED">Concluído</option>
                    <option value="PROCESSING">Varrendo</option>
                    <option value="FAILED">Falhou</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase flex items-center gap-1 mb-1.5">
                    <Server className="h-3 w-3 text-blue-400" /> Tipo
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full bg-[#15151a] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="NETWORK">Infraestrutura (Nmap)</option>
                    <option value="WEB">Aplicação Web (Nikto)</option>
                  </select>
                </div>

                {(statusFilter !== "ALL" || typeFilter !== "ALL") && (
                  <button
                    onClick={() => {
                      setStatusFilter("ALL");
                      setTypeFilter("ALL");
                    }}
                    className="w-full text-center text-[11px] text-primary hover:underline pt-1"
                  >
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground border-b border-white/5 bg-[#15151a]/40 uppercase tracking-wider font-mono">
            <tr>
              <th className="px-6 py-3.5 w-10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-white/20 bg-transparent accent-primary cursor-pointer"
                />
              </th>
              <th className="px-6 py-3.5 font-medium">Tipo / Motor</th>
              <th className="px-6 py-3.5 font-medium">Status</th>
              <th className="px-6 py-3.5 font-medium">Alvo (Workload)</th>
              <th className="px-6 py-3.5 font-medium">Nível de Segurança</th>
              <th className="px-6 py-3.5 font-medium">Data</th>
              <th className="px-6 py-3.5 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {filteredScans.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-muted-foreground text-sm"
                >
                  Nenhuma varredura encontrada para os critérios selecionados.
                </td>
              </tr>
            ) : (
              filteredScans.map((scan) => {
                const statusInfo = getStatusDisplay(scan.status);
                const score = calculateScanScore(scan);
                const isChecked = selectedIds.has(scan.id);

                return (
                  <tr
                    key={scan.id}
                    className={`hover:bg-white/[0.03] transition-colors ${
                      isChecked ? "bg-primary/5" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSelect(scan.id)}
                        className="rounded border-white/20 bg-transparent accent-primary cursor-pointer"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            scan.type === "WEB"
                              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          }`}
                        >
                          {scan.type === "WEB" ? (
                            <Globe className="h-4 w-4" />
                          ) : (
                            <Server className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-foreground font-semibold">
                            {scan.type === "WEB"
                              ? "Web App (Nikto)"
                              : "Infraestrutura (Nmap)"}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono">
                            ID: {scan.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}
                      >
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-foreground font-semibold">
                      {scan.target}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex gap-[2px]">
                          {[...Array(10)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-2.5 w-1 rounded-sm transition-all ${
                                i < Math.round(score / 10)
                                  ? score > 70
                                    ? "bg-emerald-400"
                                    : score > 40
                                    ? "bg-primary"
                                    : "bg-red-400"
                                  : "bg-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          {score}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground font-mono">
                      {scan.createdAt
                        ? format(new Date(scan.createdAt), "dd/MM/yyyy HH:mm")
                        : "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <ScanReportDialog
                          scan={scan}
                          selectedScan={selectedScan}
                          setSelectedScan={setSelectedScan}
                          trigger={
                            <button
                              onClick={() => setSelectedScan(scan)}
                              title="Ver Relatório Detalhado"
                              className="p-1.5 rounded-lg border border-white/10 hover:border-primary/40 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            >
                              <Search className="h-4 w-4" />
                            </button>
                          }
                        />
                        <button
                          onClick={(e) => handleDeleteScan(scan.id, e)}
                          title="Excluir do Histórico"
                          className="p-1.5 rounded-lg border border-white/10 hover:border-red-500/40 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
