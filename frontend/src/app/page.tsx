"use client";

import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

import { Scan, DashboardStats } from "@/lib/types";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { NewScanForm } from "@/components/dashboard/NewScanForm";
import { RecentScansHistory } from "@/components/dashboard/RecentScansHistory";
import { TopNav } from "@/components/dashboard/TopNav";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function Home() {
  const { token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [target, setTarget] = useState("");
  const [scans, setScans] = useState<Scan[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [scanType, setScanType] = useState<"NETWORK" | "WEB">("NETWORK");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [scansRes, statsRes] = await Promise.all([
        fetch("http://localhost:3000/scans", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3000/scans/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (scansRes.status === 401 || statsRes.status === 401) {
        logout();
        return;
      }

      const scansData = await scansRes.json().catch(() => []);
      const statsData = await statsRes.json().catch(() => null);

      setScans(Array.isArray(scansData) ? scansData : []);
      setStats(statsData || { totalScans: 0, uniqueTargets: 0, topPorts: [] });
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
      setIsScanModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      alert("Erro");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="min-h-screen font-sans">
      <div className="max-w-7xl mx-auto space-y-2 p-2 sm:p-6">
        <TopNav />
        
        <div className="flex justify-end mb-4 px-2">
           <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
             <DialogTrigger asChild>
               <Button className="bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(217,70,239,0.3)]">
                 <Plus className="h-4 w-4 mr-2" /> New Scan
               </Button>
             </DialogTrigger>
             <DialogContent className="bg-[#1a1a21] border border-white/10 text-white sm:max-w-md">
                <DialogTitle className="sr-only">New Scan Form</DialogTitle>
                <NewScanForm
                  target={target}
                  setTarget={setTarget}
                  scanType={scanType}
                  setScanType={setScanType}
                  handleScan={handleScan}
                  loading={loading}
                />
             </DialogContent>
           </Dialog>
        </div>

        <DashboardStatsCards stats={stats} />

        <div className="grid grid-cols-12 gap-6">
          <RecentScansHistory
            scans={scans}
            selectedScan={selectedScan}
            setSelectedScan={setSelectedScan}
          />
        </div>
      </div>
    </div>
  );
}
