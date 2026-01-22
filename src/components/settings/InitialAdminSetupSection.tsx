import { useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "not_found"; message: string }
  | { type: "error"; message: string };

export function InitialAdminSetupSection() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Admin");
  const [setupToken, setSetupToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });

  const canSubmit = useMemo(() => {
    const cleaned = email.trim().toLowerCase();
    return cleaned.includes("@") && password.length >= 6 && setupToken.trim().length > 0 && !submitting;
  }, [email, password, setupToken, submitting]);

  const handleSubmit = async () => {
    const cleanedEmail = email.trim().toLowerCase();

    if (!cleanedEmail || !cleanedEmail.includes("@")) {
      setStatus({ type: "error", message: "Informe um e-mail válido." });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: "error", message: "A senha deve ter pelo menos 6 caracteres." });
      return;
    }
    if (!setupToken.trim()) {
      setStatus({ type: "error", message: "Informe o Setup Token." });
      return;
    }

    setSubmitting(true);
    setStatus({ type: "idle" });

    try {
      const { data, error } = await supabase.functions.invoke("bootstrap-first-admin", {
        body: {
          email: cleanedEmail,
          password,
          full_name: fullName.trim() || "Admin",
        },
        headers: {
          "x-setup-token": setupToken.trim(),
        },
      });

      if (error) {
        const anyErr = error as any;
        const httpStatus = anyErr?.context?.status;
        const msg = String(error.message || "Erro ao criar admin");

        const isNotFound =
          httpStatus === 404 ||
          msg.toLowerCase().includes("not_found") ||
          msg.toLowerCase().includes("not found") ||
          msg.toLowerCase().includes("404");

        if (isNotFound) {
          setStatus({
            type: "not_found",
            message:
              "O backend não encontrou a função bootstrap-first-admin. Peça para o responsável pelo backend publicar essa função e tente novamente.",
          });
          return;
        }

        setStatus({ type: "error", message: msg });
        return;
      }

      const ok = (data as any)?.success === true;
      if (!ok) {
        setStatus({
          type: "error",
          message: "Não foi possível concluir o setup. Verifique os dados e tente novamente.",
        });
        return;
      }

      setStatus({
        type: "success",
        message: "Admin criado/resetado com sucesso. Agora faça login com o e-mail e senha informados.",
      });
    } catch (e: any) {
      setStatus({ type: "error", message: e?.message || "Erro inesperado ao criar admin." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Setup Inicial (Primeiro Admin)
        </CardTitle>
        <CardDescription>
          Crie/reset o primeiro admin usando um Setup Token configurado no backend. (Não usa SERVICE_ROLE_KEY.)
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.type === "success" && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {status.type === "not_found" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        {status.type === "error" && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{status.message}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email do admin</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@seudominio.com" />
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
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Dica: após criar o admin, saia e entre novamente para atualizar permissões.</p>
          <Button variant="gradient" disabled={!canSubmit} onClick={handleSubmit}>
            {submitting ? "Criando..." : "Criar Admin"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
