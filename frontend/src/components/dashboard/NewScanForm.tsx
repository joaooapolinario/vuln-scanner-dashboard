import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Activity, Globe, ShieldAlert } from "lucide-react";

interface NewScanFormProps {
  target: string;
  setTarget: (v: string) => void;
  scanType: "NETWORK" | "WEB";
  setScanType: (v: "NETWORK" | "WEB") => void;
  handleScan: () => void;
  loading: boolean;
}

export function NewScanForm({
  target,
  setTarget,
  scanType,
  setScanType,
  handleScan,
  loading,
}: NewScanFormProps) {
  return (
    <div className="flex flex-col gap-4 py-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">
          Tipo de Análise
        </label>
        <Select
          value={scanType}
          onValueChange={(v) => setScanType(v as "NETWORK" | "WEB")}
        >
          <SelectTrigger className="bg-[#15151a] border-white/10 text-white">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent className="bg-[#15151a] border-white/10 text-white">
            <SelectItem value="NETWORK" className="hover:bg-white/5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-500" />
                <span>Infraestrutura (Nmap)</span>
              </div>
            </SelectItem>
            <SelectItem value="WEB" className="hover:bg-white/5">
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
          className="bg-[#15151a] border-white/10 text-white focus-visible:ring-primary"
          placeholder={
            scanType === "WEB" ? "Ex: http://teste.com" : "Ex: scanme.nmap.org"
          }
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
        />
      </div>

      <Button onClick={handleScan} disabled={loading} className="w-full mt-4 bg-primary text-white hover:bg-primary/90">
        {loading ? "Enfileirando..." : "Iniciar Scan"}
        <ShieldAlert className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
