import { DashboardStats } from "@/lib/types";
import { Activity, Target, ShieldAlert, Server } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Bar, BarChart } from "recharts";

interface DashboardStatsCardsProps {
  stats: DashboardStats | null;
}

const generateMockSparkline = () => Array.from({ length: 10 }).map((_, i) => ({ value: Math.random() * 100 }));

export function DashboardStatsCards({ stats }: DashboardStatsCardsProps) {
  const mockData1 = generateMockSparkline();
  const mockData2 = generateMockSparkline();
  const mockData3 = generateMockSparkline();

  // Calcular um Score Fictício baseado em portas reais
  const portRisk = (stats?.topPorts?.length || 0) * 15;
  const targetRisk = (stats?.uniqueTargets || 0) * 5;
  const calculatedRisk = Math.min(100, Math.max(0, portRisk + targetRisk));
  const riskIndex = calculatedRisk > 0 ? (calculatedRisk / 10).toFixed(1) + "%" : "0%";


  return (
    <div className="grid gap-6 md:grid-cols-12 mb-6">
      
      {/* Left Area: 4 Cards */}
      <div className="col-span-12 lg:col-span-8 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-wide">Your Attack Surface</h2>
          <span className="text-xs font-medium text-muted-foreground bg-[#27272a] px-3 py-1 rounded-full border border-white/5">Daily</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          {/* Card 1 */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-primary/20 rounded-lg text-primary shadow-[0_0_10px_rgba(217,70,239,0.2)]">
                <ShieldAlert className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{stats?.totalScans || 0}</div>
                <div className="text-[10px] text-muted-foreground">Total Scans</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData1}>
                  <Bar dataKey="value" fill="#d946ef" radius={[2,2,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-blue-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                <Target className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{stats?.uniqueTargets || 0}</div>
                <div className="text-[10px] text-muted-foreground">Targets</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData2}>
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

          {/* Card 3 */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-orange-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-orange-500/20 rounded-lg text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                <Server className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{stats?.topPorts?.length || 0}</div>
                <div className="text-[10px] text-muted-foreground">Open Ports</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topPorts || mockData1}>
                  <Bar dataKey="count" fill="#f97316" radius={[2,2,0,0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-[#15151a]/80 rounded-xl p-4 border border-white/5 flex flex-col justify-between group hover:border-pink-500/50 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="p-2 bg-pink-500/20 rounded-lg text-pink-400 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                <Activity className="h-4 w-4" />
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{riskIndex}</div>
                <div className="text-[10px] text-muted-foreground">Risk Index</div>
              </div>
            </div>
            <div className="h-12 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData3}>
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
      <div className="col-span-12 lg:col-span-4 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold tracking-wide">Risk Score</h2>
          <button className="text-muted-foreground hover:text-foreground">...</button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center relative">
           {/* SVG Gauge representation */}
           <svg viewBox="0 0 200 120" className="w-full max-w-[280px]">
             {/* Background tracks */}
             {[...Array(20)].map((_, i) => {
               const angle = -180 + (i * 180 / 19);
               const isFilled = i < 14; // 70% filled
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
           
           <div className="absolute bottom-6 flex flex-col items-center">
             <span className="text-xs text-muted-foreground mb-1">Score</span>
             <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-500">
               {calculatedRisk}%
             </span>
           </div>
           
           <div className="w-full flex justify-between absolute bottom-0 px-8 text-xs text-muted-foreground font-medium">
             <span>0</span>
             <span>100</span>
           </div>
        </div>
      </div>
      
    </div>
  );
}
