"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    });
    if (data) {
      router.push("/app");
    } else {
      alert(error?.message || "Erro ao fazer login");
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0],
    });
    if (data) {
      router.push("/app");
    } else {
      alert(error?.message || "Erro ao registrar");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md p-8 bg-white dark:bg-zinc-950 border rounded-xl shadow-sm">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Bem-vindo ao CRM</h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          Faça login ou crie uma conta para continuar
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">E-mail</label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="seu@email.com" 
              required 
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Senha</label>
            <Input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <Button type="button" variant="outline" onClick={handleRegister} disabled={loading}>
              Criar nova conta
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
