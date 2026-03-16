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
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:3000/scans/stats", {
          headers: { Authorization: `Bearer ${token}` },
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

        <DashboardStatsCards stats={stats} />

        <div className="grid gap-4 md:grid-cols-7">
          <NewScanForm
            target={target}
            setTarget={setTarget}
            scanType={scanType}
            setScanType={setScanType}
            handleScan={handleScan}
            loading={loading}
          />

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
