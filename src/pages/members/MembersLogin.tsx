import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowLeft } from "lucide-react";
import gateflowLogo from "@/assets/gateflow-logo.png";

const MembersLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos. Verifique e tente novamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao fazer login",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      toast({
        title: "Login realizado!",
        description: "Bem-vindo à área de membros.",
      });
      
      navigate("/members");
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao fazer login.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/members`,
      });

      if (error) {
        toast({
          title: "Erro ao enviar email",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Email enviado!",
        description: "Verifique sua caixa de entrada para redefinir sua senha.",
      });
      setIsResetMode(false);
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar o email.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <img src={gateflowLogo} alt="Gateflow" className="h-16 w-auto" />
          <h1 className="text-2xl font-bold text-foreground">Área de Membros</h1>
        </div>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              {isResetMode ? "Recuperar Senha" : "Acesse sua conta"}
            </CardTitle>
            <CardDescription className="text-center">
              {isResetMode 
                ? "Digite seu email para receber o link de recuperação"
                : "Entre com seu email e senha para acessar seus produtos"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background/50"
                />
              </div>

              {!isResetMode && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background/50"
                  />
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Aguarde...
                  </>
                ) : isResetMode ? (
                  "Enviar Email"
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>

            <div className="mt-4 text-center">
              {isResetMode ? (
                <Button
                  variant="ghost"
                  onClick={() => setIsResetMode(false)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar ao login
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setIsResetMode(true)}
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Esqueceu sua senha?
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Você recebeu o acesso por email após sua compra.
        </p>
      </div>
    </div>
  );
};

export default MembersLogin;
