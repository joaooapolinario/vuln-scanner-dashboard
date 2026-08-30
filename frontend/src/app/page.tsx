"use client";

import { io } from "socket.io-client";
import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { Scan, DashboardStats } from "@/lib/types";
import { API_BASE_URL, fetchWithAuth, ApiError } from "@/lib/api";
import { DashboardStatsCards } from "@/components/dashboard/DashboardStatsCards";
import { NewScanForm } from "@/components/dashboard/NewScanForm";
import { RecentScansHistory } from "@/components/dashboard/RecentScansHistory";
import { TopNav } from "@/components/dashboard/TopNav";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Home() {
  const { token, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [target, setTarget] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [scanType, setScanType] = useState<"NETWORK" | "WEB">("NETWORK");
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // SWR fetcher autenticado
  const fetcher = useCallback(
    <T,>(url: string) => fetchWithAuth<T>(url, token),
    [token],
  );

  const {
    data: scans = [],
    mutate: mutateScans,
  } = useSWR<Scan[]>(token ? "/scans" : null, fetcher, {
    revalidateOnFocus: true,
    onError: (err: ApiError) => {
      if (err?.status === 401) logout();
    },
  });

  const {
    data: stats = null,
    mutate: mutateStats,
  } = useSWR<DashboardStats>(token ? "/scans/stats" : null, fetcher, {
    revalidateOnFocus: true,
    onError: (err: ApiError) => {
      if (err?.status === 401) logout();
    },
  });

  const handleRefresh = useCallback(() => {
    mutateScans();
    mutateStats();
  }, [mutateScans, mutateStats]);

  const handleScan = async () => {
    if (!target) return;
    setLoading(true);
    try {
      await fetchWithAuth<Scan>("/scans", token, {
        method: "POST",
        body: JSON.stringify({ target, type: scanType }),
      });

      setTarget("");
      setIsScanModalOpen(false);
      handleRefresh();
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) {
        alert("Sessão expirada");
        logout();
        return;
      }
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("Erro ao iniciar scan");
      }
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

    const socket = io(API_BASE_URL);

    socket.on("connect", () => {
      console.log("⚡ Conectado ao WebSocket em tempo real!");
    });

    socket.on("scanUpdate", (data) => {
      console.log("🔄 Atualização de scan recebida via Socket:", data);
      handleRefresh();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, handleRefresh]);

  if (authLoading || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#15151a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-[#15151a] text-foreground">
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

        <DashboardStatsCards stats={stats} scans={scans} />

        <div className="grid grid-cols-12 gap-6">
          <RecentScansHistory
            scans={scans}
            selectedScan={selectedScan}
            setSelectedScan={setSelectedScan}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
}
