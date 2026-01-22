import { useMemo, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

const setupSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(200),
  full_name: z.string().trim().max(120).optional().nullable(),
  setup_token: z.string().trim().min(1, "Informe o Setup Token").max(200),
});

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

export default function Setup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Admin");
  const [setupToken, setSetupToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const canSubmit = useMemo(() => {
    const parsed = setupSchema.safeParse({
      email,
      password,
      full_name: fullName,
      setup_token: setupToken,
    });
    return parsed.success && !submitting;
  }, [email, password, fullName, setupToken, submitting]);

  const handleSubmit = async () => {
    setStatus({ type: "idle" });

    const parsed = setupSchema.safeParse({
      email,
      password,
      full_name: fullName,
      setup_token: setupToken,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0]?.message || "Dados inválidos";
      setStatus({ type: "error", message: first });
      return;
    }

    const { email: cleanEmail, password: cleanPassword, full_name, setup_token } = parsed.data;
    const normalizedFullName = (full_name ?? "").trim() || "Admin";

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-first-admin", {
        body: {
          email: cleanEmail,
          password: cleanPassword,
          full_name: normalizedFullName,
        },
        headers: {
          "x-setup-token": setup_token,
        },
      });

      if (error) {
        // Evitar vazar detalhes sensíveis
        const anyErr = error as any;
        const httpStatus = anyErr?.context?.status;
        const msg = String(error.message || "Erro ao criar admin");

        if (httpStatus === 409 || msg.toLowerCase().includes("setup")) {
          setStatus({ type: "error", message: "Setup já foi concluído neste backend." });
          return;
        }

        if (httpStatus === 401) {
          setStatus({ type: "error", message: "Setup Token inválido." });
          return;
        }

        setStatus({ type: "error", message: msg });
        return;
      }

      const ok = (data as any)?.success === true;
      if (!ok) {
        setStatus({ type: "error", message: "Não foi possível concluir o setup." });
        return;
      }

      setStatus({
        type: "success",
        message: "Admin criado/resetado com sucesso. Redirecionando para o login…",
      });

      // Redireciona para login
      window.location.href = "/?page=auth";
    } catch {
      setStatus({ type: "error", message: "Erro inesperado ao criar admin." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card variant="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Setup Inicial
            </CardTitle>
            <CardDescription>Crie o primeiro admin (página pública protegida por Setup Token).</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {status.type === "success" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            {status.type === "error" && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label>Email do admin</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@admin.com" />
            </div>

            <div className="space-y-2">
              <Label>Senha do admin</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mín. 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label>Nome (opcional)</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Admin" />
            </div>

            <div className="space-y-2">
              <Label>Setup Token</Label>
              <Input
                type="password"
                value={setupToken}
                onChange={(e) => setSetupToken(e.target.value)}
                placeholder="Token definido no backend"
              />
            </div>

            <Button className="w-full" variant="gradient" disabled={!canSubmit} onClick={handleSubmit}>
              {submitting ? "Criando..." : "Criar Admin"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
