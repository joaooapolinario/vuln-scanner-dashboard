"use client";

import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Activity,
  Target,
  ServerCrash,
  LogOut,
  Globe,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Scan {
  id: string;
  target: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  result: any;
  logs?: string;
  type: "NETWORK" | "WEB";
}

interface DashboardStats {
  totalScans: number;
  uniqueTargets: number;
  topPorts: { port: string; count: number }[];
}

// --- PARSER AUXILIAR ---
const parseNmapResult = (scan: Scan) => {
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
const parseNiktoResult = (scan: Scan) => {
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

export default function Home() {
  const { token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [target, setTarget] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [scanType, setScanType] = useState<"NETWORK" | "WEB">("NETWORK");

  const fetchDashboardData = async () => {
    try {
      const [scansRes, statsRes] = await Promise.all([
        fetch("http://localhost:3000/scans", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("http://localhost:3000/scans/stats", {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      const scansData = await scansRes.json();
      const statsData = await statsRes.json();

      setScans(scansData);
      setStats(statsData);
    } catch (error) {
      console.error("Erro ao buscar dados", error);
    }
  };

  const handleScan = async () => {
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ target, type: scanType }),
      });

      if (res.status === 401) {
        alert("Sessão expirada");
        logout();
        return;
      }

      setTarget("");
      fetchDashboardData(); 
    } catch (error) {
      alert("Erro");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default";
      case "PROCESSING":
        return "secondary";
      case "FAILED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const chartColors = ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe"];

  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [token, authLoading, router]);

  useEffect(() => {
    if (!token) return;

    fetchDashboardData();

    const socket = io("http://localhost:3000");

    socket.on("connect", () => {
      console.log("⚡ Conectado ao WebSocket em tempo real!");
    });

    socket.on("scanUpdate", (data) => {
      console.log("🔄 Atualização de scan recebida via Socket:", data);
      fetchDashboardData(); 
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              🛡️ VulnScanner Dashboard
            </h1>
            <p className="text-muted-foreground">
              Visão geral da segurança da sua infraestrutura.
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Análises
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalScans || 0}</div>
              <p className="text-xs text-muted-foreground">
                Execuções históricas
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Alvos Monitorados
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.uniqueTargets || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                IPs ou domínios distintos
              </p>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Top 5 Portas Abertas</CardTitle>
              <CardDescription>Serviços mais expostos na rede.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.topPorts || []}>
                  <XAxis
                    dataKey="port"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip cursor={{ fill: "transparent" }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats?.topPorts.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={chartColors[index % chartColors.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-7">
          <Card className="col-span-3 h-fit">
            <CardHeader>
              <CardTitle>Iniciar Nova Varredura</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Tipo de Análise
                </label>
                <Select
                  value={scanType}
                  onValueChange={(v) => setScanType(v as "NETWORK" | "WEB")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NETWORK">
                      <div className="flex items-center gap-2">
                        <Activity className="h-4 w-4 text-blue-500" />
                        <span>Infraestrutura (Nmap)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="WEB">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-orange-500" />
                        <span>Aplicação Web (Nikto)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Alvo (IP ou URL)
                </label>
                <Input
                  placeholder={
                    scanType === "WEB"
                      ? "Ex: http://teste.com"
                      : "Ex: scanme.nmap.org"
                  }
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleScan()}
                />
              </div>

              <Button
                onClick={handleScan}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Enfileirando..." : "Iniciar Scan"}
                <ShieldAlert className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Histórico Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alvo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scans.slice(0, 5).map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell className="font-medium truncate max-w-37.5">
                        {scan.target}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(scan.status) as any}
                          className="text-[10px]"
                        >
                          {scan.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedScan(scan)}
                            >
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
                                      <Badge
                                        variant={
                                          getStatusColor(scan.status) as any
                                        }
                                        className="text-sm px-3 py-1"
                                      >
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
                                  <p className="text-lg font-medium">
                                    Analisando alvo selecionado...
                                  </p>
                                </div>
                              )}

                              {scan.status === "FAILED" && (
                                <div className="p-6 bg-red-50 border border-red-100 text-red-800 rounded-xl">
                                  <h4 className="font-bold flex items-center gap-2 mb-2 text-lg">
                                    <ServerCrash className="h-5 w-5" /> Falha
                                    Fatal
                                  </h4>
                                  <pre className="bg-white/50 p-4 rounded-lg text-sm font-mono text-red-900 border border-red-200 mt-4">
                                    {scan.logs || "Erro desconhecido. Verifique o console do Worker."}
                                  </pre>
                                </div>
                              )}

                              {scan.status === "COMPLETED" && (
                                <>
                                  {/* RENDERIZAÇÃO NMAP */}
                                  {((scan as any).type === "NETWORK" ||
                                    !(scan as any).type) && (
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
                                                  {
                                                    parseNmapResult(scan)
                                                      ?.openPorts.length
                                                  }
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
                                                  {new Date(
                                                    scan.createdAt,
                                                  ).toLocaleDateString("pt-BR")}
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </div>

                                          <Separator />

                                          <div>
                                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                                              <Activity className="h-6 w-6 text-blue-600" />{" "}
                                              Detalhamento de Portas
                                            </h3>

                                            {parseNmapResult(scan)?.openPorts
                                              .length === 0 ? (
                                              <div className="p-8 text-center border-2 border-dashed rounded-xl bg-slate-50 text-slate-500">
                                                <p>
                                                  Nenhuma porta aberta
                                                  encontrada ou o host não
                                                  respondeu ao ping.
                                                </p>
                                                <p className="text-xs mt-2">
                                                  Verifique o "JSON Bruto"
                                                  abaixo para detalhes.
                                                </p>
                                              </div>
                                            ) : (
                                              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                                <Table>
                                                  <TableHeader className="bg-slate-100/80">
                                                    <TableRow>
                                                      <TableHead>
                                                        Porta
                                                      </TableHead>
                                                      <TableHead>
                                                        Estado
                                                      </TableHead>
                                                      <TableHead>
                                                        Serviço
                                                      </TableHead>
                                                      <TableHead className="text-right">
                                                        Versão
                                                      </TableHead>
                                                    </TableRow>
                                                  </TableHeader>
                                                  <TableBody>
                                                    {parseNmapResult(
                                                      scan,
                                                    )?.openPorts.map(
                                                      (p: any, i: number) => (
                                                        <TableRow
                                                          key={i}
                                                          className="hover:bg-blue-50/30"
                                                        >
                                                          <TableCell className="font-mono font-bold text-blue-700">
                                                            {p.port}/
                                                            {p.protocol}
                                                          </TableCell>
                                                          <TableCell>
                                                            <Badge
                                                              variant="outline"
                                                              className="bg-emerald-100 text-emerald-800 border-emerald-200"
                                                            >
                                                              {p.state}
                                                            </Badge>
                                                          </TableCell>
                                                          <TableCell>
                                                            {p.service}
                                                          </TableCell>
                                                          <TableCell className="text-right text-slate-600 text-sm">
                                                            {p.product}{" "}
                                                            {p.version}
                                                          </TableCell>
                                                        </TableRow>
                                                      ),
                                                    )}
                                                  </TableBody>
                                                </Table>
                                              </div>
                                            )}
                                          </div>
                                        </>
                                      ) : (
                                        <div className="p-6 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200">
                                          <h3 className="font-bold">
                                            Formato de Resposta Inválido
                                          </h3>
                                          <p>
                                            O Nmap rodou, mas o resultado não
                                            pôde ser lido. Verifique o JSON
                                            bruto abaixo.
                                          </p>
                                        </div>
                                      )}
                                    </>
                                  )}

                                  {/* RENDERIZAÇÃO NIKTO */}
                                  {((scan as any).type === 'WEB') && parseNiktoResult(scan) && (
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
                                                      <Badge variant="outline" className={`
                                                        font-mono text-[10px] px-2 border-0 font-bold
                                                        ${v.method === 'GET' ? 'bg-blue-100 text-blue-700' : 
                                                          v.method === 'POST' ? 'bg-green-100 text-green-700' : 
                                                          'bg-slate-100 text-slate-700'}
                                                      `}>
                                                        {v.method}
                                                      </Badge>
                                                      {v.osvdb !== '0' && (
                                                          <span className="text-[10px] font-mono text-slate-400">OSVDB: {v.osvdb}</span>
                                                      )}
                                                  </div>

                                                  <p className="text-sm text-slate-800 font-medium leading-relaxed">
                                                      {v.msg}
                                                  </p>

                                                  {v.url && v.url !== '/' && (
                                                      <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-100 flex items-start gap-2 overflow-hidden">
                                                          <Globe className="h-3 w-3 text-slate-400 mt-1 shrink-0" />
                                                          <code className="text-xs font-mono text-blue-600 break-all">
                                                              {v.url}
                                                          </code>
                                                      </div>
                                                  )}
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
                                        <pre>
                                          {JSON.stringify(scan.result, null, 2)}
                                        </pre>
                                      </div>
                                    </details>
                                  </div>
                                </>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
