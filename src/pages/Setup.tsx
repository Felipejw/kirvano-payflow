import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { AlertTriangle, CheckCircle2, Shield } from "lucide-react";

type SetupDebug = {
  siteOrigin: string;
  siteProtocol: string;
  backendUrl: string;
  backendOrigin: string;
  backendProtocol: string;
  mixedContentRisk: boolean;
  userAgent: string;
  timestamp: string;
};

const getDebugInfo = (): SetupDebug => {
  const backendUrl = String(import.meta.env.VITE_SUPABASE_URL || "");
  let backendOrigin = "";
  let backendProtocol = "";
  try {
    if (backendUrl) {
      const u = new URL(backendUrl);
      backendOrigin = u.origin;
      backendProtocol = u.protocol;
    }
  } catch {
    // ignore
  }

  const siteProtocol = window.location.protocol;
  return {
    siteOrigin: window.location.origin,
    siteProtocol,
    backendUrl,
    backendOrigin,
    backendProtocol,
    mixedContentRisk: siteProtocol === "https:" && backendProtocol === "http:",
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
  };
};

const setupSchema = z.object({
  email: z.string().trim().email("Informe um e-mail válido").max(255),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").max(200),
  full_name: z.string().trim().max(120).optional().nullable(),
  setup_token: z.string().trim().min(1, "Informe o Setup Token").max(200),
});

type Status =
  | { type: "idle" }
  | { type: "success"; message: string }
  | { type: "setup_done"; message: string }
  | { type: "error"; message: string };

const INVALID_TOKEN_HELP =
  "Setup Token inválido. Se você não configurou um token no backend, use o token padrão (gateflow_setup_v1). Se o backend estiver com um token personalizado configurado (secret SETUP_TOKEN), use exatamente esse valor. Se você não tiver acesso ao backend, peça ao administrador da instalação.";

const NETWORK_ERROR_HELP =
  "Não foi possível enviar a solicitação ao backend. Isso geralmente acontece por bloqueio de rede/CORS (muito comum em VPS/proxy). Tente: 1) aba anônima, 2) desativar AdBlock/extensões, 3) testar em outra rede (4G). Se persistir, peça ao instalador para liberar chamadas do navegador ao backend e confirmar que a URL/chave do backend estão corretas.";

export default function Setup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Admin");
  const [setupToken, setSetupToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [debug, setDebug] = useState<SetupDebug>(() => getDebugInfo());

  const goToLogin = () => {
    window.location.href = "/?page=auth";
  };

  // Checagem leve: com um Setup Token válido, chamamos a função com body vazio.
  // Ela responde 409 (setup concluído) antes de validar campos.
  useEffect(() => {
    setDebug(getDebugInfo());
    const token = setupToken.trim();
    if (!token) return;

    const t = window.setTimeout(async () => {
      try {
        const { error } = await supabase.functions.invoke("bootstrap-first-admin", {
          // Enviar o token no body evita header customizado (que costuma disparar preflight/CORS em VPS).
          body: { setup_token: token },
        });

        if (!error) return;

        const anyErr = error as any;
        const httpStatus = anyErr?.context?.status;
        const msg = String(error.message || "");

        if (httpStatus === 409 || msg.toLowerCase().includes("setup")) {
          setStatus({
            type: "setup_done",
            message: "Setup já concluído: o admin já existe. Basta ir para o login em /?page=auth.",
          });
        }
      } catch {
        // silêncio: é apenas uma checagem de conveniência
      }
    }, 400);

    return () => window.clearTimeout(t);
  }, [setupToken]);

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
    setDebug(getDebugInfo());
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
          setup_token,
        },
      });

      if (error) {
        // Evitar vazar detalhes sensíveis
        const anyErr = error as any;
        const httpStatus = anyErr?.context?.status;
        const msg = String(error.message || "Erro ao criar admin");

        // Quando o browser bloqueia a chamada (CORS/preflight), o client costuma retornar essa mensagem genérica.
        if (!httpStatus && msg.toLowerCase().includes("failed to send")) {
          const dbg = getDebugInfo();
          if (dbg.mixedContentRisk) {
            setStatus({
              type: "error",
              message:
                "Bloqueio por segurança (Mixed Content): o site está em HTTPS mas o backend está em HTTP. Corrija o backend para usar HTTPS ou ajuste a configuração do BACKEND_URL no servidor e faça novo build/deploy.",
            });
            return;
          }
          setStatus({ type: "error", message: NETWORK_ERROR_HELP });
          return;
        }

        if (httpStatus === 409 || msg.toLowerCase().includes("setup")) {
          setStatus({
            type: "setup_done",
            message: "Setup já concluído: o admin já existe. Basta ir para o login em /?page=auth.",
          });
          return;
        }

        if (httpStatus === 401) {
          setStatus({ type: "error", message: INVALID_TOKEN_HELP });
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
      goToLogin();
    } catch {
      const dbg = getDebugInfo();
      if (dbg.mixedContentRisk) {
        setStatus({
          type: "error",
          message:
            "Bloqueio por segurança (Mixed Content): o site está em HTTPS mas o backend está em HTTP. Corrija o backend para usar HTTPS ou ajuste a configuração do BACKEND_URL no servidor e faça novo build/deploy.",
        });
      } else {
        setStatus({ type: "error", message: NETWORK_ERROR_HELP });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const copyDebug = async () => {
    const dbg = getDebugInfo();
    setDebug(dbg);
    const text = JSON.stringify(dbg, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setStatus({ type: "success", message: "Diagnóstico copiado. Cole aqui no chat." });
    } catch {
      // fallback simples
      setStatus({ type: "error", message: "Não consegui copiar automaticamente. Selecione e copie manualmente no bloco de diagnóstico." });
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
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Se aparecer <strong>"Setup já concluído"</strong>, significa que o admin já foi criado e você só precisa
                entrar em <strong>/?page=auth</strong>.
              </AlertDescription>
            </Alert>

            {status.type === "success" && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{status.message}</AlertDescription>
              </Alert>
            )}

            {status.type === "setup_done" && (
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

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription className="space-y-2">
                <div>
                  <strong>Diagnóstico rápido</strong> (sem DevTools):
                </div>
                <div className="text-sm text-muted-foreground">
                  Site: <strong>{debug.siteOrigin}</strong> | Backend: <strong>{debug.backendOrigin || "(não detectado)"}</strong>
                </div>
                {debug.mixedContentRisk && (
                  <div className="text-sm">
                    <strong>Atenção:</strong> seu site está em HTTPS, mas o backend está em HTTP — isso costuma bloquear a chamada.
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={copyDebug}>
                    Copiar diagnóstico
                  </Button>
                </div>
                <pre className="max-h-40 overflow-auto rounded-md bg-muted p-3 text-xs">
{JSON.stringify(debug, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>

            {status.type !== "setup_done" ? (
              <>
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
                  <p className="text-sm text-muted-foreground">
                    Se você <strong>não configurou</strong> um token no backend, o padrão é <strong>gateflow_setup_v1</strong>. Se
                    houver um token personalizado (secret <strong>SETUP_TOKEN</strong>), use o valor configurado nele.
                  </p>
                </div>

                <Button className="w-full" variant="gradient" disabled={!canSubmit} onClick={handleSubmit}>
                  {submitting ? "Criando..." : "Criar Admin"}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Button className="w-full" variant="gradient" onClick={goToLogin}>
                  Ir para Login
                </Button>
              </div>
            )}

            {status.type !== "setup_done" && (
              <Button className="w-full" variant="outline" onClick={goToLogin}>
                Ir para Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
