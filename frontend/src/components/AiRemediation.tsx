import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bot, Sparkles, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AiRemediationProps {
  tool: string;
  finding: string;
}

export function AiRemediation({ tool, finding }: AiRemediationProps) {
  const { token } = useAuth();
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRemediation = async () => {
    if (explanation) return; 

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/ai/remediate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tool, finding }),
      });

      if (!response.ok) {
        throw new Error("Falha ao consultar a IA");
      }

      const result = await response.json();
      setExplanation(result.data);
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao falar com a IA");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="secondary" 
          size="sm" 
          className="gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 mt-2"
          onClick={fetchRemediation}
        >
          <Sparkles className="h-4 w-4" />
          Explicar com IA
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-indigo-700 text-xl border-b pb-4">
            <Bot className="h-6 w-6" />
            Análise de Segurança por IA
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="mb-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Alerta Original ({tool})
            </h4>
            <p className="font-mono text-sm text-slate-800">{finding}</p>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-indigo-400">
              <Sparkles className="h-8 w-8 animate-pulse mb-4" />
              <p>O Engenheiro de Segurança de IA está analisando a vulnerabilidade...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {explanation && !loading && (
            <div className="prose prose-slate max-w-none prose-headings:text-indigo-900 prose-a:text-indigo-600 prose-code:text-indigo-600 prose-code:bg-indigo-50 prose-code:px-1 prose-code:rounded">
              <ReactMarkdown>{explanation}</ReactMarkdown>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}