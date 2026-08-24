import { Scan } from "@/lib/types";
import { ScanReportDialog } from "./ScanReportDialog";
import { Search, SlidersHorizontal, Cloud, Server } from "lucide-react";
import { format } from "date-fns";

interface RecentScansHistoryProps {
  scans: Scan[];
  selectedScan: Scan | null;
  setSelectedScan: (scan: Scan | null) => void;
}

export function RecentScansHistory({ scans, selectedScan, setSelectedScan }: RecentScansHistoryProps) {
  
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'COMPLETED': return { color: 'text-green-400', label: 'Completed' };
      case 'FAILED': return { color: 'text-red-400', label: 'Failed' };
      case 'PROCESSING': return { color: 'text-blue-400', label: 'Scanning' };
      default: return { color: 'text-gray-400', label: 'Pending' };
    }
  };

  return (
    <div className="col-span-12 bg-[#1a1a21]/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
      {/* Header section */}
      <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-wide">Attack Surface Overview</h2>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-[#15151a] border border-white/5 rounded-full pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:border-primary/50 text-foreground w-full sm:w-64"
            />
          </div>
          <button className="p-2 rounded-full bg-[#15151a] border border-white/5 text-muted-foreground hover:text-foreground">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground border-b border-white/5 bg-[#15151a]/30">
            <tr>
              <th className="px-6 py-4 font-medium"><input type="checkbox" className="rounded border-white/10 bg-transparent" /></th>
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Status / Connector</th>
              <th className="px-6 py-4 font-medium">Target / Workload</th>
              <th className="px-6 py-4 font-medium">Security Score</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {!Array.isArray(scans) || scans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No scans found in your attack surface.
                </td>
              </tr>
            ) : (
              scans.slice(0, 10).map((scan) => {
                const statusInfo = getStatusDisplay(scan.status);
                // Mock random score for visuals
                const score = scan.status === 'COMPLETED' ? Math.floor(Math.random() * 60) + 40 : 0; 
                
                return (
                  <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <input type="checkbox" className="rounded border-white/20 bg-transparent accent-primary" />
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded bg-orange-500/10 text-orange-400">
                          <Server className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-foreground">{scan.type === 'WEB' ? 'Web App' : 'Infrastructure'}</div>
                          <div className="text-[10px] text-muted-foreground">Compute | Network</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Cloud className={`h-4 w-4 ${statusInfo.color}`} />
                        <span className="text-xs font-medium">{statusInfo.label}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {scan.target}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-[2px]">
                          {[...Array(10)].map((_, i) => (
                            <div 
                              key={i} 
                              className={`h-2.5 w-1 rounded-sm ${i < (score / 10) ? 'bg-primary' : 'bg-white/10'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{score}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                       {scan.createdAt ? format(new Date(scan.createdAt), 'MMM dd, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <ScanReportDialog
                            scan={scan}
                            selectedScan={selectedScan}
                            setSelectedScan={setSelectedScan}
                            trigger={
                              <button onClick={() => setSelectedScan(scan)} className="p-1.5 rounded-md border border-white/10 hover:bg-white/5 text-muted-foreground transition-colors">
                                <Search className="h-3.5 w-3.5" />
                              </button>
                            }
                          />
                       </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
