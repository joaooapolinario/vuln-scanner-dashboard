"use client";

import { useState, useRef, useEffect } from "react";
import {
  Shield,
  LayoutDashboard,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";

export function TopNav() {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "ANALYST":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <header className="flex items-center justify-between py-4 px-4 sm:px-6 mb-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-wide text-foreground">
            VulnScanner
          </span>
          <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
            PRO
          </span>
        </div>
      </div>

      {/* Center Nav Pill */}
      <div className="hidden md:flex items-center gap-2 bg-[#1a1a21]/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 shadow-inner">
        <div className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-primary bg-primary/10 transition-colors rounded-full border border-primary/20 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
          <LayoutDashboard className="h-4 w-4" />
          <span>Dashboard & Attack Surface</span>
        </div>
      </div>

      {/* Right Actions / User Profile */}
      <div className="flex items-center gap-3 relative" ref={dropdownRef}>
        <button
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-[#1a1a21]/60 border border-white/10 hover:border-white/20 transition-all text-left group"
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[1.5px]">
            <div className="h-full w-full rounded-full bg-[#15151a] flex items-center justify-center overflow-hidden">
              <User className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
          <div className="hidden sm:flex flex-col text-xs leading-tight">
            <span className="font-semibold text-foreground truncate max-w-[120px]">
              {user?.name || "Usuário"}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {user?.role || "VIEWER"}
            </span>
          </div>
        </button>

        {/* Profile Dropdown */}
        {isProfileOpen && (
          <div className="absolute right-0 top-12 mt-2 w-64 rounded-2xl bg-[#1c1c22] border border-white/10 p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px]">
                <div className="h-full w-full rounded-full bg-[#15151a] flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="overflow-hidden">
                <p className="font-semibold text-sm text-foreground truncate">
                  {user?.name || "Administrador"}
                </p>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {user?.email || "admin@scanner.com"}
                </p>
              </div>
            </div>

            <div className="py-3 border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Nível de Acesso
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase font-mono ${getRoleBadgeVariant(
                    user?.role,
                  )}`}
                >
                  {user?.role || "ANALYST"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
