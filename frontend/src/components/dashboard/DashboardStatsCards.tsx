import { DashboardStats, Scan } from "@/lib/types";
import { Activity, Target, ShieldAlert, Server } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Bar, BarChart } from "recharts";

interface DashboardStatsCardsProps {
  stats: DashboardStats | null;
  scans?: Scan[];
}

export function DashboardStatsCards({ stats, scans = [] }: DashboardStatsCardsProps) {
  // Calcular Risk Score real determinístico
  const openPortsCount = stats?.topPorts?.reduce((acc, p) => acc + p.count, 0) || 0;
  const uniqueTargetsCount = stats?.uniqueTargets || 0;
  const totalScansCount = stats?.totalScans || 0;
  
  // Score determinístico baseado em dados reais do sistema
  const baseRisk = Math.min(100, Math.round((openPortsCount * 12) + (uniqueTargetsCount * 8)));
  const calculatedRisk = totalScansCount === 0 ? 0 : baseRisk;
  const riskIndex = calculatedRisk > 0 ? `${(calculatedRisk / 10).toFixed(1)}%` : "0%";

  // Gráfico de distribuição de Scans recentes (Histórico real)
  const recentScansData = scans.slice(0, 8).reverse().map((s, idx) => ({
    name: `Scan ${idx + 1}`,
    value: s.status === 'COMPLETED' ? 80 : s.status === 'PROCESSING' ? 40 : 20,
  }));

  const fallbackChartData = totalScansCount > 0 
    ? [{ value: 30 }, { value: 60 }, { value: 45 }, { value: 80 }, { value: calculatedRisk }]
    : [{ value: 0 }, { value: 0 }, { value: 0 }];

  const portsData = (stats?.topPorts && stats.topPorts.length > 0)
    ? stats.topPorts
    : [{ port: "None", count: 0 }];

  return (
    <div className="grid gap-6 md:grid-cols-12 mb-6">
      
      {/* Left Area: 4 Cards */}
      <div className="col-span-12 lg:col-span-8 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground">Superfície de Ataque</h2>
            <p className="text-xs text-muted-foreground">Métricas consolidadas de infraestrutura e aplicações</p>
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground bg-[#27272a]/60 px-3 py-1 rounded-full border border-white/5">
            Tempo Real
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {/* Card 1: Total Scans */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{totalScansCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Total Scans</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recentScansData.length > 0 ? recentScansData : fallbackChartData}>
                  <Bar dataKey="value" fill="#d946ef" radius={[2,2,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Targets */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <Target className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{uniqueTargetsCount}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Alvos Únicos</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fallbackChartData}>
                  <defs>
                    <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBlue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Top Ports */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-orange-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                <Server className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{stats?.topPorts?.length || 0}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Portas Abertas</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={portsData}>
                  <Bar dataKey="count" fill="#f97316" radius={[2,2,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4: Risk Index */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-pink-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                <Activity className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{riskIndex}</div>
                <div className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider">Índice de Risco</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={fallbackChartData}>
                  <defs>
                    <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="#ec4899" strokeWidth={2} fillOpacity={1} fill="url(#colorPink)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Right Area: Risk Score Gauge */}
      <div className="col-span-12 lg:col-span-4 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-wide text-foreground">Postura de Segurança</h2>
            <p className="text-xs text-muted-foreground">Avaliação contínua de risco</p>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative min-h-[160px]">
           {/* SVG Gauge representation */}
           <svg viewBox="0 0 200 120" className="w-full max-w-[260px]">
             {/* Background tracks */}
             {[...Array(20)].map((_, i) => {
               const angle = -180 + (i * 180 / 19);
               const isFilled = i < Math.round((calculatedRisk / 100) * 20);
               return (
                 <line 
                   key={i}
                   x1="100" y1="100" x2="100" y2="20"
                   stroke={isFilled ? `url(#gaugeGradient)` : "#27272a"}
                   strokeWidth="6"
                   strokeLinecap="round"
                   transform={`rotate(${angle} 100 100)`}
                 />
               );
             })}
             <defs>
               <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#ec4899" />
                 <stop offset="100%" stopColor="#8b5cf6" />
               </linearGradient>
             </defs>
           </svg>
           
           <div className="absolute bottom-4 flex flex-col items-center">
             <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-0.5">Nível de Exposição</span>
             <span className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
               {calculatedRisk}%
             </span>
           </div>
           
           <div className="w-full flex justify-between absolute bottom-0 px-6 text-[10px] text-muted-foreground font-mono font-medium">
             <span>0 (Seguro)</span>
             <span>100 (Crítico)</span>
           </div>
        </div>
      </div>
      
    </div>
  );
}
