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
import { Activity, Globe, ServerCrash, ShieldAlert } from "lucide-react";
import { AiRemediation } from "@/components/AiRemediation";
import { Scan } from "@/lib/types";
import { parseNiktoResult, parseNmapResult } from "@/lib/parsers";
import { getStatusColor } from "@/lib/utils";

interface ScanReportDialogProps {
  scan: Scan;
  selectedScan: Scan | null;
  setSelectedScan: (scan: Scan | null) => void;
}

export function ScanReportDialog({ scan, selectedScan, setSelectedScan }: ScanReportDialogProps) {
  return (
    <Dialog open={selectedScan?.id === scan.id} onOpenChange={(open) => !open && setSelectedScan(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)}>
          Ver Relatório
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="p-6 sm:p-8 border-b sticky top-0 bg-white z-10">
          <DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between pr-8">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-2xl font-bold">
                    Relatório de Vulnerabilidades
                  </DialogTitle>
                  <Badge variant={getStatusColor(scan.status) as any} className="text-sm px-3 py-1">
                    {scan.status}
                  </Badge>
                </div>
              </div>

              <DialogDescription className="text-base flex items-center gap-2">
                Alvo:{" "}
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                  {scan.target}
                </span>
                <span className="text-slate-300">|</span>
                ID:{" "}
                <span className="font-mono text-xs text-slate-400">
                  {scan.id}
                </span>
              </DialogDescription>
            </div>
          </DialogHeader>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {scan.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-lg font-medium">Analisando alvo selecionado...</p>
            </div>
          )}

          {scan.status === "FAILED" && (
            <div className="p-6 bg-red-50 border border-red-100 text-red-800 rounded-xl">
              <h4 className="font-bold flex items-center gap-2 mb-2 text-lg">
                <ServerCrash className="h-5 w-5" /> Falha Fatal
              </h4>
              <pre className="bg-white/50 p-4 rounded-lg text-sm font-mono text-red-900 border border-red-200 mt-4">
                {scan.logs || "Erro desconhecido. Verifique o console do Worker."}
              </pre>
            </div>
          )}

          {scan.status === "COMPLETED" && (
            <>
              {/* RENDERIZAÇÃO NMAP */}
              {(scan.type === "NETWORK" || !scan.type) && (
                <>
                  {parseNmapResult(scan) ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-600 uppercase">
                              Endereço IP
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold font-mono text-slate-900">
                              {parseNmapResult(scan)?.ip}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50/50 border-green-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-600 uppercase">
                              Portas Abertas
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold font-mono text-slate-900">
                              {parseNmapResult(scan)?.openPorts.length}
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                              Data
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-lg font-medium text-slate-700 mt-1">
                              {new Date(scan.createdAt).toLocaleDateString("pt-BR")}
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Separator />

                      <div>
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                          <Activity className="h-6 w-6 text-blue-600" /> Detalhamento de Portas
                        </h3>

                        {parseNmapResult(scan)?.openPorts.length === 0 ? (
                          <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50 text-slate-500">
                            <p>Nenhuma porta aberta encontrada ou o host não respondeu ao ping.</p>
                            <p className="text-xs mt-2">Verifique o "JSON Bruto" abaixo para detalhes.</p>
                          </div>
                        ) : (
                          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                            <Table>
                              <TableHeader className="bg-slate-100/80">
                                <TableRow>
                                  <TableHead>Porta</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead>Serviço</TableHead>
                                  <TableHead className="text-right">Versão</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {parseNmapResult(scan)?.openPorts.map((p: any, i: number) => (
                                  <TableRow key={i} className="hover:bg-blue-50/30">
                                    <TableCell className="font-mono font-bold text-blue-700">
                                      {p.port}/{p.protocol}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                        {p.state}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>{p.service}</TableCell>
                                    <TableCell className="text-right text-slate-600 text-sm">
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
                    <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                      <h3 className="font-bold">Formato de Resposta Inválido</h3>
                      <p>O Nmap rodou, mas o resultado não pôde ser lido. Verifique o JSON bruto abaixo.</p>
                    </div>
                  )}
                </>
              )}

              {/* RENDERIZAÇÃO NIKTO */}
              {scan.type === "WEB" && parseNiktoResult(scan) && (
                <>
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">Servidor Web</h4>
                      <div className="text-lg font-mono font-bold text-slate-800 break-all">
                        {parseNiktoResult(scan)?.host}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {parseNiktoResult(scan)?.banner || "Banner não detectado"}
                      </div>
                    </div>

                    <div className="w-full md:w-48 bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col justify-center items-center">
                      <h4 className="text-xs font-bold text-red-600 uppercase mb-1">Vulnerabilidades</h4>
                      <div className="text-3xl font-bold text-red-700">
                        {parseNiktoResult(scan)?.vulnerabilities.length}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <div>
                    <h3 className="text-lg font-bold mb-4 text-slate-800 flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-red-600" /> Detalhes dos Achados
                    </h3>

                    <div className="space-y-3">
                      {parseNiktoResult(scan)?.vulnerabilities.map((v: any, i: number) => (
                        <div key={i} className="p-4 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors bg-white shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              variant="outline"
                              className={`font-mono text-[10px] px-2 border-0 font-bold ${
                                v.method === "GET"
                                  ? "bg-blue-100 text-blue-700"
                                  : v.method === "POST"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {v.method}
                            </Badge>
                            {v.osvdb !== "0" && (
                              <span className="text-[10px] font-mono text-slate-400">OSVDB: {v.osvdb}</span>
                            )}
                          </div>

                          <p className="text-sm text-slate-800 font-medium leading-relaxed">{v.msg}</p>

                          {v.url && v.url !== "/" && (
                            <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-2 overflow-hidden">
                              <Globe className="h-3 w-3 text-slate-400 mt-1 shrink-0" />
                              <code className="text-xs font-mono text-blue-600 break-all">{v.url}</code>
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
              <div className="mt-8 pt-6 border-t border-slate-100">
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-500 hover:text-blue-600">
                    <span>Ver JSON Bruto (Debug)</span>
                  </summary>
                  <div className="mt-4 bg-slate-950 text-slate-300 p-6 rounded-xl overflow-auto max-h-80 text-xs font-mono shadow-inner">
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
