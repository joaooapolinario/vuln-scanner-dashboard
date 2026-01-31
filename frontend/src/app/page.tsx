"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context"; 
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Target, ServerCrash, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// --- TIPAGENS ---
interface Scan {
  id: string;
  target: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: string;
  result: any;
  logs?: string;
}

interface DashboardStats {
  totalScans: number;
  uniqueTargets: number;
  topPorts: { port: string; count: number }[];
}

// --- PARSER AUXILIAR ---
const parseNmapResult = (scan: Scan) => {
  if (scan.status !== 'COMPLETED' || !scan.result) return null;
  try {
    const host = scan.result?.nmaprun?.host?.[0];
    if (!host) return null;
    
    const ports = host.ports?.[0]?.port || [];
    const openPorts = ports.map((p: any) => ({
      port: p.$.portid,
      protocol: p.$.protocol,
      state: p.state?.[0]?.$.state,
      service: p.service?.[0]?.$.name || "unknown",
      product: p.service?.[0]?.$.product || "",
      version: p.service?.[0]?.$.version || "",
    }));

    return { ip: host.address?.[0]?.$.addr, openPorts };
  } catch (e) { return null; }
};

export default function Home() {
  // 1. TODOS OS HOOKS DEVEM FICAR NO TOPO
  const { token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [target, setTarget] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);

  // 2. DEFINIÇÃO DE FUNÇÕES
  const fetchDashboardData = async () => {
    try {
      const [scansRes, statsRes] = await Promise.all([
        fetch("http://localhost:3000/scans"),
        fetch("http://localhost:3000/scans/stats")
      ]);
      
      const scansData = await scansRes.json();
      const statsData = await statsRes.json();
      
      setScans(scansData);
      setStats(statsData);
    } catch (error) { console.error("Erro ao buscar dados", error); }
  };

  const handleScan = async () => {
    if (!target) return;
    setLoading(true);
    try {
      // Envia o Token no Header
      const res = await fetch("http://localhost:3000/scans", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ target }),
      });

      if (res.status === 401) {
        alert("Sessão expirada");
        logout();
        return;
      }

      setTarget("");
      fetchDashboardData();
    } catch (error) { alert("Erro"); } 
    finally { setLoading(false); }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED": return "default";
      case "PROCESSING": return "secondary";
      case "FAILED": return "destructive";
      default: return "outline";
    }
  };

  const chartColors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];


  
  // Effect de Proteção de Rota
  useEffect(() => {
    if (!authLoading && !token) {
      router.push("/login");
    }
  }, [token, authLoading, router]);

  // Effect de Polling de Dados
  useEffect(() => {
    // Só busca dados se tiver token
    if (token) {
      fetchDashboardData();
      const interval = setInterval(fetchDashboardData, 5000);
      return () => clearInterval(interval);
    }
  }, [token]); 

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ); 
  }

  // 5. RENDERIZAÇÃO PRINCIPAL
  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
             <h1 className="text-3xl font-bold tracking-tight text-slate-900">🛡️ VulnScanner Dashboard</h1>
             <p className="text-muted-foreground">Visão geral da segurança da sua infraestrutura.</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>

        {/* --- SEÇÃO DE WIDGETS --- */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Análises</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalScans || 0}</div>
              <p className="text-xs text-muted-foreground">Execuções históricas</p>
            </CardContent>
          </Card>

           <Card className="col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alvos Monitorados</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.uniqueTargets || 0}</div>
              <p className="text-xs text-muted-foreground">IPs ou domínios distintos</p>
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
                  <XAxis dataKey="port" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats?.topPorts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* --- ÁREA DE INPUT E TABELA --- */}
        <div className="grid gap-4 md:grid-cols-7">
            <Card className="col-span-3 h-fit">
            <CardHeader><CardTitle>Iniciar Nova Varredura</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
                <Input 
                  placeholder="Ex: scanme.nmap.org" 
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                />
                <Button onClick={handleScan} disabled={loading} className="w-full">
                  {loading ? "Enfileirando..." : "Iniciar Scan"}
                  <ServerCrash className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
            </Card>
            
            <Card className="col-span-4">
            <CardHeader><CardTitle>Histórico Recente</CardTitle></CardHeader>
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
                    <TableCell className="font-medium truncate max-w-[150px]">{scan.target}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(scan.status) as any} className="text-[10px]">{scan.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedScan(scan)}>
                            Ver Relatório
                          </Button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                          {/* HEADER FIXO */}
                          <div className="p-6 sm:p-8 border-b sticky top-0 bg-white z-10">
                            <DialogHeader>
                              <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between pr-8">
                                  <div className="flex items-center gap-3">
                                      <DialogTitle className="text-2xl font-bold">Relatório de Vulnerabilidades</DialogTitle>
                                      <Badge variant={getStatusColor(scan.status) as any} className="text-sm px-3 py-1">
                                        {scan.status}
                                      </Badge>
                                  </div>
                                </div>
                                
                                <DialogDescription className="text-base flex items-center gap-2">
                                  Alvo: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{scan.target}</span>
                                  <span className="text-slate-300">|</span>
                                  ID: <span className="font-mono text-xs text-slate-400">{scan.id}</span>
                                </DialogDescription>
                              </div>
                            </DialogHeader>
                          </div>

                          {/* CONTEÚDO */}
                          <div className="p-6 sm:p-8 space-y-8">
                            {/* LOADING */}
                            {scan.status === 'PROCESSING' && (
                              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-slate-50 rounded-xl border-2 border-dashed">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                                <p className="text-lg font-medium">Analisando infraestrutura...</p>
                              </div>
                            )}

                            {/* ERROR */}
                            {scan.status === 'FAILED' && (
                              <div className="p-6 bg-red-50 border border-red-100 text-red-800 rounded-xl">
                                <h4 className="font-bold flex items-center gap-2 mb-2 text-lg">
                                  <ServerCrash className="h-5 w-5"/> Falha Fatal
                                </h4>
                                <pre className="bg-white/50 p-4 rounded-lg text-sm font-mono text-red-900 border border-red-200 mt-4">
                                  {scan.logs || "Erro desconhecido."}
                                </pre>
                              </div>
                            )}

                            {/* SUCCESS */}
                            {scan.status === 'COMPLETED' && parseNmapResult(scan) && (
                              <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <Card className="bg-blue-50/50 border-blue-100 shadow-sm">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-blue-600 uppercase tracking-wider">Endereço IP</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-3xl font-bold font-mono text-slate-900">{parseNmapResult(scan)?.ip}</div>
                                      </CardContent>
                                  </Card>
                                  <Card className="bg-green-50/50 border-green-100 shadow-sm">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">Serviços Ativos</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-3xl font-bold font-mono text-slate-900">{parseNmapResult(scan)?.openPorts.length}</div>
                                      </CardContent>
                                  </Card>
                                  <Card className="bg-slate-50/50 border-slate-100 shadow-sm">
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Data da Análise</CardTitle>
                                      </CardHeader>
                                      <CardContent>
                                        <div className="text-lg font-medium text-slate-700 mt-1">
                                            {new Date(scan.createdAt).toLocaleDateString('pt-BR')}
                                            <span className="block text-sm text-slate-400">{new Date(scan.createdAt).toLocaleTimeString('pt-BR')}</span>
                                        </div>
                                      </CardContent>
                                  </Card>
                                </div>

                                <Separator />

                                <div>
                                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800">
                                    <Activity className="h-6 w-6 text-blue-600" /> Detalhamento de Portas e Serviços
                                  </h3>
                                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                    <Table>
                                      <TableHeader className="bg-slate-100/80">
                                        <TableRow>
                                          <TableHead className="w-[120px] font-bold text-slate-700">Porta / Proto</TableHead>
                                          <TableHead className="w-[120px] font-bold text-slate-700">Estado</TableHead>
                                          <TableHead className="font-bold text-slate-700">Serviço</TableHead>
                                          <TableHead className="text-right font-bold text-slate-700">Versão do Software</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {parseNmapResult(scan)?.openPorts.map((p: any, i: number) => (
                                          <TableRow key={i} className="hover:bg-blue-50/30 transition-colors text-base">
                                            <TableCell className="font-mono font-bold text-blue-700">
                                              {p.port}<span className="text-slate-400 font-normal">/{p.protocol}</span>
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-200 px-3">
                                                {p.state}
                                              </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium text-slate-700">
                                              {p.service}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600 font-mono text-sm">
                                              {p.product ? (
                                                <div className="inline-block text-right">
                                                    <div>{p.product}</div>
                                                    {p.version && (
                                                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs border border-slate-200 mt-1 inline-block">
                                                            v{p.version}
                                                        </span>
                                                    )}
                                                </div>
                                              ) : (
                                                <span className="italic opacity-30">Desconhecido</span>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                  <details className="group">
                                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                                        <span>Ver JSON Bruto (Debug)</span>
                                        <div className="h-px bg-slate-200 flex-1"></div>
                                    </summary>
                                    <div className="mt-4 bg-slate-950 text-slate-300 p-6 rounded-xl overflow-auto max-h-80 text-xs font-mono leading-relaxed shadow-inner">
                                      <pre>{JSON.stringify(scan.result, null, 2)}</pre>
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
