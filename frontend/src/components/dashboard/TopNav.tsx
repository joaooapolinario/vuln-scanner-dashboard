import { 
  Shield, 
  LayoutDashboard, 
  Search, 
  Layers, 
  ShieldAlert, 
  Bell, 
  LogOut, 
  User 
} from "lucide-react";
import { useAuth } from "@/context/auth-context";

export function TopNav() {
  const { logout } = useAuth();
  
  return (
    <div className="flex items-center justify-between py-4 px-6 mb-6">
      {/* Logo */}
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-wide">VulnScanner</span>
      </div>

      {/* Center Nav Pill */}
      <div className="hidden md:flex items-center gap-2 bg-[#1a1a21]/50 backdrop-blur-md px-2 py-1.5 rounded-full border border-white/5">
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
          <Search className="h-4 w-4" />
          Findings
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 transition-colors rounded-full border border-primary/20 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
          <Layers className="h-4 w-4" />
          Attack Surface
        </button>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-white/5">
          <ShieldAlert className="h-4 w-4" />
          Threats
        </button>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        <button className="p-2.5 rounded-full bg-[#1a1a21]/50 border border-white/5 text-muted-foreground hover:text-foreground transition-colors">
          <Search className="h-4 w-4" />
        </button>
        <button className="p-2.5 rounded-full bg-[#1a1a21]/50 border border-white/5 text-muted-foreground hover:text-foreground transition-colors relative">
          <span className="absolute top-2 right-2.5 h-2 w-2 bg-primary rounded-full animate-pulse" />
          <Bell className="h-4 w-4" />
        </button>
        <button onClick={logout} title="Sair" className="p-2.5 rounded-full bg-[#1a1a21]/50 border border-white/5 text-muted-foreground hover:text-red-400 transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
        <div className="h-10 w-10 ml-2 rounded-full bg-gradient-to-tr from-primary to-blue-500 p-[2px]">
          <div className="h-full w-full rounded-full bg-background flex items-center justify-center overflow-hidden">
             <User className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
