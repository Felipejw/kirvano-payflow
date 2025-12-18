import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowLeft, ArrowRight, Check, User, Mail, Briefcase, CreditCard, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import gateflowLogo from "@/assets/gateflow-logo.png";
import { useAppNavigate } from "@/lib/routes";
import { PaymentModeSelector } from "@/components/auth/PaymentModeSelector";
import { TermsOfService } from "@/components/shared/TermsOfService";
import { cn } from "@/lib/utils";

const SALES_NICHES = [
  "Cursos Online",
  "E-books",
  "Mentorias",
  "Software/SaaS",
  "Serviços Digitais",
  "Produtos Físicos",
  "Dropshipping",
  "Marketing Digital",
  "Finanças",
  "Saúde e Bem-estar",
  "Desenvolvimento Pessoal",
  "Outros",
];

const REVENUE_RANGES = [
  "Ainda não faturei",
  "Até R$ 5.000/mês",
  "R$ 5.000 a R$ 20.000/mês",
  "R$ 20.000 a R$ 50.000/mês",
  "R$ 50.000 a R$ 100.000/mês",
  "Acima de R$ 100.000/mês",
];

const STEPS = [
  { id: 1, title: "Dados Pessoais", icon: User },
  { id: 2, title: "Contato", icon: Mail },
  { id: 3, title: "Negócio", icon: Briefcase },
  { id: 4, title: "Pagamento", icon: CreditCard },
  { id: 5, title: "Termos", icon: FileText },
];

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [documentType, setDocumentType] = useState<"cpf" | "cnpj">("cpf");
  const [documentNumber, setDocumentNumber] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [salesNiche, setSalesNiche] = useState("");
  const [averageRevenue, setAverageRevenue] = useState("");
  const [paymentMode, setPaymentMode] = useState<"platform_gateway" | "own_gateway">("own_gateway");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [platformFees, setPlatformFees] = useState({
    platformGatewayFeePercentage: 5.99,
    platformGatewayFeeFixed: 1,
    platformGatewayWithdrawalFee: 5,
    ownGatewayFeePercentage: 3.99,
    ownGatewayFeeFixed: 1,
  });
  const navigate = useAppNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Defer role check to avoid deadlock
        setTimeout(async () => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", session.user.id)
            .maybeSingle();
          
          const userRole = roleData?.role || 'seller';
          
          if (userRole === 'member') {
            window.location.href = '/members';
          } else {
            navigate("dashboard");
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        const userRole = roleData?.role || 'seller';
        
        if (userRole === 'member') {
          window.location.href = '/members';
        } else {
          navigate("dashboard");
        }
      }
    });

    // Fetch platform fees
    fetchPlatformFees();

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPlatformFees = async () => {
    const { data } = await supabase
      .from("platform_settings")
      .select("platform_gateway_fee_percentage, platform_gateway_fee_fixed, platform_gateway_withdrawal_fee, own_gateway_fee_percentage, own_gateway_fee_fixed")
      .single();

    if (data) {
      setPlatformFees({
        platformGatewayFeePercentage: data.platform_gateway_fee_percentage || 5.99,
        platformGatewayFeeFixed: data.platform_gateway_fee_fixed || 1,
        platformGatewayWithdrawalFee: data.platform_gateway_withdrawal_fee || 5,
        ownGatewayFeePercentage: data.own_gateway_fee_percentage || 3.99,
        ownGatewayFeeFixed: data.own_gateway_fee_fixed || 1,
      });
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14);
    return numbers
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  };

  const handleDocumentChange = (value: string) => {
    if (documentType === "cpf") {
      setDocumentNumber(formatCPF(value));
    } else {
      setDocumentNumber(formatCNPJ(value));
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!fullName.trim()) {
          toast({ title: "Nome obrigatório", variant: "destructive" });
          return false;
        }
        const cleanDocument = documentNumber.replace(/\D/g, "");
        if (documentType === "cpf" && cleanDocument.length !== 11) {
          toast({ title: "CPF inválido", description: "O CPF deve conter 11 dígitos.", variant: "destructive" });
          return false;
        }
        if (documentType === "cnpj" && cleanDocument.length !== 14) {
          toast({ title: "CNPJ inválido", description: "O CNPJ deve conter 14 dígitos.", variant: "destructive" });
          return false;
        }
        if (documentType === "cnpj" && !companyName.trim()) {
          toast({ title: "Razão Social obrigatória", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (!email.trim() || !email.includes("@")) {
          toast({ title: "Email inválido", variant: "destructive" });
          return false;
        }
        if (password.length < 6) {
          toast({ title: "Senha muito curta", description: "Mínimo 6 caracteres.", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        if (!salesNiche) {
          toast({ title: "Selecione seu nicho", variant: "destructive" });
          return false;
        }
        if (!averageRevenue) {
          toast({ title: "Selecione sua faixa de faturamento", variant: "destructive" });
          return false;
        }
        return true;
      case 4:
        return true;
      case 5:
        if (!termsAccepted) {
          toast({ title: "Aceite os termos", description: "Você precisa aceitar os termos para continuar.", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(Math.min(currentStep + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(5)) return;

    setLoading(true);
    const cleanDocument = documentNumber.replace(/\D/g, "");

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
            document_type: documentType,
            document_number: cleanDocument,
            company_name: documentType === "cnpj" ? companyName : null,
            sales_niche: salesNiche,
            average_revenue: averageRevenue,
            payment_mode: paymentMode,
          },
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está registrado. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Conta criada!",
          description: "Você será redirecionado para o dashboard.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
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
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro ao fazer login",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Seu nome completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de documento</Label>
              <Select 
                value={documentType} 
                onValueChange={(value: "cpf" | "cnpj") => {
                  setDocumentType(value);
                  setDocumentNumber("");
                  if (value === "cpf") setCompanyName("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpf">CPF (Pessoa Física)</SelectItem>
                  <SelectItem value="cnpj">CNPJ (Pessoa Jurídica)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">
                {documentType === "cpf" ? "CPF" : "CNPJ"}
              </Label>
              <Input
                id="documentNumber"
                type="text"
                placeholder={documentType === "cpf" ? "000.000.000-00" : "00.000.000/0000-00"}
                value={documentNumber}
                onChange={(e) => handleDocumentChange(e.target.value)}
              />
            </div>

            {documentType === "cnpj" && (
              <div className="space-y-2">
                <Label htmlFor="companyName">Razão Social</Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Nome da empresa"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registerEmail">Email</Label>
              <Input
                id="registerEmail"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registerPassword">Senha</Label>
              <div className="relative">
                <Input
                  id="registerPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nicho de vendas</Label>
              <Select value={salesNiche} onValueChange={setSalesNiche}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione seu nicho" />
                </SelectTrigger>
                <SelectContent>
                  {SALES_NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Média de faturamento</Label>
              <Select value={averageRevenue} onValueChange={setAverageRevenue}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua faixa" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_RANGES.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 4:
        return (
          <PaymentModeSelector
            value={paymentMode}
            onChange={setPaymentMode}
            platformFees={platformFees}
          />
        );
      case 5:
        return (
          <TermsOfService
            mode={paymentMode}
            accepted={termsAccepted}
            onAcceptChange={setTermsAccepted}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar ao início
        </Link>

        <Card className="glass-card">
          <CardHeader className="text-center">
            <img src={gateflowLogo} alt="Gateflow" className="h-12 w-auto mx-auto mb-4" />
            <CardTitle className="text-2xl gradient-text">Gateflow</CardTitle>
            <CardDescription>Acesse sua conta ou crie uma nova</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full btn-primary-gradient" disabled={loading}>
                    {loading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                {/* Step Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    {STEPS.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                              currentStep === step.id
                                ? "bg-primary text-primary-foreground"
                                : currentStep > step.id
                                ? "bg-green-500 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {currentStep > step.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <step.icon className="h-4 w-4" />
                            )}
                          </div>
                          <span className="text-xs mt-1 hidden md:block text-muted-foreground">
                            {step.title}
                          </span>
                        </div>
                        {index < STEPS.length - 1 && (
                          <div
                            className={cn(
                              "w-8 md:w-12 h-0.5 mx-1",
                              currentStep > step.id ? "bg-green-500" : "bg-muted"
                            )}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleSignUp}>
                  {renderStepContent()}

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Voltar
                    </Button>

                    {currentStep < 5 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="btn-primary-gradient"
                      >
                        Próximo
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="btn-primary-gradient"
                        disabled={loading || !termsAccepted}
                      >
                        {loading ? "Criando conta..." : "Criar conta"}
                      </Button>
                    )}
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
