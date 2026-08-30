"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Shield } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.message || "Credenciais inválidas");
      }

      const data = await res.json();
      login(data.access_token, data.user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Erro desconhecido ao autenticar");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#15151a] p-4">
      <Card className="w-full max-w-sm bg-[#1c1c22] border-white/10 text-white shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2 border border-primary/20 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">VulnScanner</CardTitle>
          <CardDescription className="text-muted-foreground">
            Acesse seu dashboard de segurança
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="admin@scanner.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[#15151a] border-white/10 text-white focus-visible:ring-primary"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-[#15151a] border-white/10 text-white focus-visible:ring-primary"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 text-center font-medium">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(217,70,239,0.25)]"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
