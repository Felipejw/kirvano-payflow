import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, Lock, ArrowLeft, Eye, EyeOff, GraduationCap, Sparkles } from "lucide-react";
import gateflowLogo from "@/assets/gateflow-logo.png";

const MembersLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      
      navigate("/?page=members");
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent" />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Header */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-xl opacity-30 animate-pulse" />
              <img 
                src={gateflowLogo} 
                alt="Gateflow" 
                className="relative h-16 w-auto drop-shadow-2xl" 
              />
            </div>
            
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                <GraduationCap className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">Área de Membros</span>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Acesse seus produtos
              </h1>
            </div>
          </div>

          {/* Login Card */}
          <div className="relative group">
            {/* Card glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
            
            <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl">
              {/* Mode indicator */}
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">
                  {isResetMode ? "Recuperar Senha" : "Fazer Login"}
                </h2>
              </div>

              <p className="text-slate-400 text-sm mb-6">
                {isResetMode 
                  ? "Digite seu email para receber o link de recuperação"
                  : "Entre com as credenciais recebidas por email"
                }
              </p>

              <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-cyan-400" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 transition-all duration-300"
                  />
                </div>

                {!isResetMode && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-cyan-400" />
                      Senha
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/20 pr-12 transition-all duration-300"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-semibold py-6 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-cyan-500/40 hover:scale-[1.02]" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Aguarde...
                    </>
                  ) : isResetMode ? (
                    "Enviar Email de Recuperação"
                  ) : (
                    "Entrar na Área de Membros"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                {isResetMode ? (
                  <button
                    onClick={() => setIsResetMode(false)}
                    className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar ao login
                  </button>
                ) : (
                  <button
                    onClick={() => setIsResetMode(true)}
                    className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-500">
              Você recebeu suas credenciais por email após a compra
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-600">
              <Lock className="h-3 w-3" />
              <span>Conexão segura e criptografada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersLogin;
