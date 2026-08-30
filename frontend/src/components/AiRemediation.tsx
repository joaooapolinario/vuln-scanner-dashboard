import { useState } from "react";
import { Bot, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { API_BASE_URL } from "@/lib/api";

interface AiRemediationProps {
  tool: string;
  finding: string;
}

export function AiRemediation({ tool, finding }: AiRemediationProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remediation, setRemediation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRemediation = async () => {
    if (remediation) return;

    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("scanner_token") || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/ai/remediation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tool, finding }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(
          errorData?.message || "Falha ao buscar recomendação da IA",
        );
      }

      const data = await res.json();
      setRemediation(data.remediation);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido ao chamar IA");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && !remediation) {
      fetchRemediation();
    }
  };

  return (
    <div className="mt-4 border border-primary/20 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-3 bg-primary/10 hover:bg-primary/20 transition-colors text-primary"
      >
        <div className="flex items-center gap-2 font-semibold text-sm">
          <Bot className="h-4 w-4" />
          <span>Análise de IA (Gemini)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      {isOpen && (
        <div className="p-4 bg-[#1a1a21]/80 text-sm border-t border-primary/20 text-foreground">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gemini está analisando esta vulnerabilidade...</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 font-medium">Erro: {error}</div>
          )}

          {remediation && (
            <div className="prose prose-sm prose-invert max-w-none prose-pre:bg-[#0a0a0c] prose-pre:border prose-pre:border-white/10 prose-headings:text-primary">
              <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg">
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                  <Bot className="h-3 w-3" /> Contexto Analisado
                </h4>
                <p className="font-mono text-sm text-foreground">{finding}</p>
              </div>

              <ReactMarkdown>{remediation}</ReactMarkdown>
            </div>
          )}
        </div>
      )}
    </div>
  );
}