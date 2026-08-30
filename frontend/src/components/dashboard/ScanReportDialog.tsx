import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Activity, Globe, ServerCrash, ShieldAlert, Download } from "lucide-react";
import { AiRemediation } from "@/components/AiRemediation";
import { Scan, NmapPort, NiktoVulnerability } from "@/lib/types";
import { parseNiktoResult, parseNmapResult } from "@/lib/parsers";
import { getStatusColor } from "@/lib/utils";
import { exportToJson } from "@/lib/findings";

interface ScanReportDialogProps {
  scan: Scan;
  selectedScan: Scan | null;
  setSelectedScan: (scan: Scan | null) => void;
  trigger?: React.ReactNode;
}

export function ScanReportDialog({ scan, selectedScan, setSelectedScan, trigger }: ScanReportDialogProps) {
  const nmapData = useMemo(() => (scan.type === "NETWORK" || !scan.type) ? parseNmapResult(scan) : null, [scan]);
  const niktoData = useMemo(() => scan.type === "WEB" ? parseNiktoResult(scan) : null, [scan]);

  return (
    <Dialog open={selectedScan?.id === scan.id} onOpenChange={(open) => !open && setSelectedScan(null)}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)}>
            Ver Relatório
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0 bg-[#15151a] border-white/10 text-foreground">
        <div className="p-6 sm:p-8 border-b border-white/10 sticky top-0 bg-[#15151a] z-10">
          <DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-bold">
                    Relatório de Vulnerabilidades
                  </DialogTitle>
                  <Badge variant={getStatusColor(scan.status)} className="text-sm px-3 py-1">
                    {scan.status}
                  </Badge>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToJson(`scan-report-${scan.target}-${scan.id.slice(0, 6)}`, scan)}
                  className="bg-white/5 border-white/10 hover:bg-white/10 text-xs gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Exportar JSON</span>
                </Button>
              </div>

              <DialogDescription className="text-base flex items-center gap-2 text-muted-foreground">
                Alvo:{" "}
                <span className="font-mono font-bold text-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10">
                  {scan.target}
                </span>
                <span className="text-white/20">|</span>
                ID:{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {scan.id}
                </span>
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {scan.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/5 rounded-xl border-2 border-dashed border-white/10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mb-4"></div>
              <p className="text-lg font-medium">Analisando alvo selecionado...</p>
            </div>
          )}

          {scan.status === "FAILED" && (
            <div className="p-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-lg">
                <ServerCrash className="h-5 w-5" /> Falha Fatal
              </h4>
              <pre className="bg-background/50 p-4 rounded-lg text-sm font-mono text-red-300 border border-red-500/20 mt-4">
                {scan.logs || "Erro desconhecido. Verifique o console do Worker."}
              </pre>
            </div>
          )}

          {scan.status === "COMPLETED" && (
            <>
              {/* RENDERIZAÇÃO NMAP */}
              {(scan.type === "NETWORK" || !scan.type) && (
                <>
                  {nmapData ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-blue-500/10 border-blue-500/20 shadow-sm text-foreground">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-400 uppercase">
                              Endereço IP
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold font-mono">
                              {nmapData.ip}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-500/10 border-green-500/20 shadow-sm text-foreground">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-400 uppercase">
                              Portas Abertas
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold font-mono">
                              {nmapData.openPorts.length}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-white/5 border-white/10 shadow-sm text-foreground">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                              Data
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-medium mt-1">
                              {new Date(scan.createdAt).toLocaleDateString("pt-BR")}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator className="bg-white/10" />

                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-foreground">
                          <Activity className="h-6 w-6 text-blue-400" /> Detalhamento de Portas
                        </h3>

                        {nmapData.openPorts.length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed border-white/10 rounded-xl bg-white/5 text-muted-foreground">
                            <p>Nenhuma porta aberta encontrada ou o host não respondeu ao ping.</p>
                            <p className="text-xs mt-2">Verifique o "JSON Bruto" abaixo para detalhes.</p>
                          </div>
                        ) : (
                          <div className="border border-white/10 rounded-xl overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader className="bg-white/5 border-b border-white/10">
                                <TableRow className="hover:bg-transparent border-none">
                                  <TableHead className="text-muted-foreground">Porta</TableHead>
                                  <TableHead className="text-muted-foreground">Estado</TableHead>
                                  <TableHead className="text-muted-foreground">Serviço</TableHead>
                                  <TableHead className="text-right text-muted-foreground">Versão</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {nmapData.openPorts.map((p: NmapPort, i: number) => (
                                  <TableRow key={i} className="hover:bg-white/5 border-b border-white/5">
                                    <TableCell className="font-mono font-bold text-blue-400">
                                      {p.port}/{p.protocol}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                        {p.state}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-foreground">{p.service}</TableCell>
                                    <TableCell className="text-right text-muted-foreground text-sm">
                                      {p.product} {p.version}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-6 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                      <h3 className="font-bold">Formato de Resposta Inválido</h3>
                      <p>O Nmap rodou, mas o resultado não pôde ser lido. Verifique o JSON bruto abaixo.</p>
                    </div>
                  )}
                </>
              )}

              {/* RENDERIZAÇÃO NIKTO */}
              {scan.type === "WEB" && niktoData && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 bg-white/5 p-4 rounded-lg border border-white/10">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase mb-1">Servidor Web</h4>
                      <div className="text-lg font-mono font-bold text-foreground break-all">
                        {niktoData.host}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {niktoData.banner || "Banner não detectado"}
                      </div>
                    </div>

                    <div className="w-full md:w-48 bg-red-500/10 p-4 rounded-lg border border-red-500/20 flex flex-col justify-center items-center">
                      <h4 className="text-xs font-bold text-red-400 uppercase mb-1">Vulnerabilidades</h4>
                      <div className="text-3xl font-bold text-red-500">
                        {niktoData.vulnerabilities.length}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6 bg-white/10" />

                  <div>
                    <h3 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-500" /> Detalhes dos Achados
                    </h3>

                    <div className="space-y-3">
                      {niktoData.vulnerabilities.map((v: NiktoVulnerability, i: number) => (
                        <div key={i} className="p-4 rounded-lg border border-white/10 hover:border-primary/50 transition-colors bg-[#1a1a21]/50 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] px-2 border-0 font-bold ${
                                v.method === "GET"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : v.method === "POST"
                                  ? "bg-green-500/20 text-green-400"
                                  : "bg-white/10 text-foreground"
                              }`}
                            >
                              {v.method}
                            </Badge>
                            {v.osvdb !== "0" && (
                              <span className="text-[10px] font-mono text-muted-foreground">OSVDB: {v.osvdb}</span>
                            )}
                          </div>

                          <p className="text-sm text-foreground font-medium leading-relaxed">{v.msg}</p>

                          {v.url && v.url !== "/" && (
                            <div className="mt-3 bg-background/50 p-2 rounded border border-white/5 flex items-start gap-2 overflow-hidden">
                              <Globe className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                              <code className="text-xs font-mono text-blue-400 break-all">{v.url}</code>
                            </div>
                          )}

                          {/* --- BOTÃO DA IA AQUI --- */}
                          <div className="mt-3">
                            <AiRemediation tool="Nikto (Web Scan)" finding={v.msg} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* DEBUG JSON (COMUM PARA OS DOIS) */}
              <div className="mt-8 pt-6 border-t border-white/10">
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-muted-foreground hover:text-primary">
                    <span>Ver JSON Bruto (Debug)</span>
                  </summary>
                  <div className="mt-4 bg-[#0a0a0c] text-muted-foreground p-6 rounded-xl overflow-auto max-h-80 text-xs font-mono shadow-inner border border-white/5">
                    <pre>{JSON.stringify(scan.result, null, 2)}</pre>
                  </div>
                </details>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
