import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  QrCode, 
  Receipt,
  Settings,
  Check,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GatewayConfigDialog } from "@/components/finance/GatewayConfigDialog";

interface Gateway {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  instructions: string | null;
  required_fields: string[];
  supports_pix: boolean;
  supports_card: boolean;
  supports_boleto: boolean;
  display_order: number;
}

interface SellerCredential {
  id: string;
  gateway_id: string;
  credentials: Record<string, string>;
  is_active: boolean;
  use_for_pix: boolean;
  use_for_card: boolean;
  use_for_boleto: boolean;
}

type PaymentMethod = 'pix' | 'card' | 'boleto';

const PaymentMethods = () => {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [credentials, setCredentials] = useState<SellerCredential[]>([]);
  const [loading, setLoading] = useState(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch available gateways
    const { data: gatewaysData } = await supabase
      .from('payment_gateways')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (gatewaysData) {
      const mapped = gatewaysData.map((g) => ({
        ...g,
        required_fields: Array.isArray(g.required_fields) ? g.required_fields as string[] : [],
        supports_pix: g.supports_pix ?? true,
        supports_card: g.supports_card ?? false,
        supports_boleto: g.supports_boleto ?? false,
        display_order: g.display_order ?? 0,
      }));
      setGateways(mapped);
    }

    // Fetch seller's credentials
    const { data: credentialsData } = await supabase
      .from('seller_gateway_credentials')
      .select('*')
      .eq('user_id', user.id);

    if (credentialsData) {
      const mapped = credentialsData.map((c) => ({
        ...c,
        credentials: (c.credentials as Record<string, string>) || {},
        use_for_pix: c.use_for_pix ?? false,
        use_for_card: c.use_for_card ?? false,
        use_for_boleto: c.use_for_boleto ?? false,
      }));
      setCredentials(mapped);
    }

    setLoading(false);
  };

  const getGatewaysForMethod = (method: PaymentMethod) => {
    const methodField = `supports_${method}` as keyof Gateway;
    return gateways.filter((g) => g[methodField] === true);
  };

  const getSelectedGatewayForMethod = (method: PaymentMethod) => {
    const methodField = `use_for_${method}` as keyof SellerCredential;
    const cred = credentials.find((c) => c[methodField] === true);
    return cred?.gateway_id || "";
  };

  const isGatewayConfigured = (gatewayId: string) => {
    const cred = credentials.find((c) => c.gateway_id === gatewayId);
    return cred && Object.keys(cred.credentials).length > 0;
  };

  const handleMethodChange = async (method: PaymentMethod, gatewayId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const methodField = `use_for_${method}`;

    // First, check if gateway is configured
    if (gatewayId && !isGatewayConfigured(gatewayId)) {
      const gateway = gateways.find((g) => g.id === gatewayId);
      if (gateway) {
        setSelectedGateway(gateway);
        setConfigDialogOpen(true);
        return;
      }
    }

    // Remove from all credentials for this method
    for (const cred of credentials) {
      await supabase
        .from('seller_gateway_credentials')
        .update({ [methodField]: false })
        .eq('id', cred.id);
    }

    // Set the new gateway for this method
    if (gatewayId) {
      const existingCred = credentials.find((c) => c.gateway_id === gatewayId);
      if (existingCred) {
        await supabase
          .from('seller_gateway_credentials')
          .update({ [methodField]: true })
          .eq('id', existingCred.id);
      }
    }

    toast.success("Configuração atualizada!");
    fetchData();
  };

  const handleConfigure = (gateway: Gateway) => {
    setSelectedGateway(gateway);
    setConfigDialogOpen(true);
  };

  const getExistingCredentials = () => {
    if (!selectedGateway) return undefined;
    const cred = credentials.find((c) => c.gateway_id === selectedGateway.id);
    return cred?.credentials;
  };

  const methodConfig = [
    {
      key: 'pix' as PaymentMethod,
      label: 'PIX',
      icon: QrCode,
      description: 'Pagamento instantâneo via PIX',
      color: 'text-green-500',
    },
    {
      key: 'card' as PaymentMethod,
      label: 'Cartão de Crédito',
      icon: CreditCard,
      description: 'Pagamento parcelado ou à vista no cartão',
      color: 'text-blue-500',
    },
    {
      key: 'boleto' as PaymentMethod,
      label: 'Boleto Bancário',
      icon: Receipt,
      description: 'Pagamento via boleto bancário',
      color: 'text-orange-500',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Formas de Pagamento</h1>
          <p className="text-muted-foreground">
            Configure como você deseja receber. O dinheiro vai direto para sua conta!
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">Carregando...</div>
        ) : (
          <>
            {/* Payment Methods Selection */}
            <div className="grid gap-4">
              {methodConfig.map((method) => {
                const availableGateways = getGatewaysForMethod(method.key);
                const selectedGatewayId = getSelectedGatewayForMethod(method.key);
                const isConfigured = selectedGatewayId && isGatewayConfigured(selectedGatewayId);

                return (
                  <Card key={method.key}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-muted ${method.color}`}>
                          <method.icon className="h-6 w-6" />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg">{method.label}</h3>
                            <p className="text-sm text-muted-foreground">{method.description}</p>
                          </div>

                          {availableGateways.length === 0 ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <AlertCircle className="h-4 w-4" />
                              <span className="text-sm">Nenhum gateway disponível para este método</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <Select
                                value={selectedGatewayId}
                                onValueChange={(value) => handleMethodChange(method.key, value)}
                              >
                                <SelectTrigger className="w-[250px]">
                                  <SelectValue placeholder="Selecione um gateway" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Nenhum</SelectItem>
                                  {availableGateways.map((g) => (
                                    <SelectItem key={g.id} value={g.id}>
                                      <div className="flex items-center gap-2">
                                        {g.name}
                                        {isGatewayConfigured(g.id) && (
                                          <Check className="h-3 w-3 text-green-500" />
                                        )}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {selectedGatewayId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const gateway = gateways.find((g) => g.id === selectedGatewayId);
                                    if (gateway) handleConfigure(gateway);
                                  }}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Configurar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          {isConfigured ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
                              <Check className="h-3 w-3 mr-1" />
                              Configurado
                            </Badge>
                          ) : selectedGatewayId ? (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Pendente
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Não configurado
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* All Configured Gateways */}
            <Card>
              <CardHeader>
                <CardTitle>Todos os Gateways Configurados</CardTitle>
                <CardDescription>
                  Visualize e gerencie todas as suas configurações de gateway
                </CardDescription>
              </CardHeader>
              <CardContent>
                {credentials.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum gateway configurado ainda
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {credentials.map((cred) => {
                      const gateway = gateways.find((g) => g.id === cred.gateway_id);
                      if (!gateway) return null;

                      const hasCredentials = Object.keys(cred.credentials).length > 0;

                      return (
                        <div
                          key={cred.id}
                          className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 mb-3">
                            {gateway.logo_url ? (
                              <img 
                                src={gateway.logo_url} 
                                alt={gateway.name} 
                                className="h-10 w-10 object-contain rounded"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{gateway.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {hasCredentials ? "Configurado" : "Pendente"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {cred.use_for_pix && (
                              <Badge variant="outline" className="text-xs">PIX</Badge>
                            )}
                            {cred.use_for_card && (
                              <Badge variant="outline" className="text-xs">Cartão</Badge>
                            )}
                            {cred.use_for_boleto && (
                              <Badge variant="outline" className="text-xs">Boleto</Badge>
                            )}
                            {!cred.use_for_pix && !cred.use_for_card && !cred.use_for_boleto && (
                              <span className="text-xs text-muted-foreground">Nenhum método ativo</span>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => handleConfigure(gateway)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            {hasCredentials ? "Editar" : "Configurar"}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Show unconfigured gateways */}
                {gateways.filter((g) => !credentials.find((c) => c.gateway_id === g.id)).length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                      Gateways Disponíveis
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {gateways
                        .filter((g) => !credentials.find((c) => c.gateway_id === g.id))
                        .map((gateway) => (
                          <div
                            key={gateway.id}
                            className="p-4 rounded-lg border border-dashed bg-card/50 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 mb-3">
                              {gateway.logo_url ? (
                                <img 
                                  src={gateway.logo_url} 
                                  alt={gateway.name} 
                                  className="h-10 w-10 object-contain rounded opacity-50"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-muted-foreground">{gateway.name}</p>
                                <div className="flex gap-1 mt-1">
                                  {gateway.supports_pix && <QrCode className="h-3 w-3 text-muted-foreground" />}
                                  {gateway.supports_card && <CreditCard className="h-3 w-3 text-muted-foreground" />}
                                  {gateway.supports_boleto && <Receipt className="h-3 w-3 text-muted-foreground" />}
                                </div>
                              </div>
                            </div>

                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => handleConfigure(gateway)}
                            >
                              Configurar
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Gateway Config Dialog */}
        <GatewayConfigDialog
          gateway={selectedGateway}
          open={configDialogOpen}
          onOpenChange={setConfigDialogOpen}
          existingCredentials={getExistingCredentials()}
          onSaved={fetchData}
        />
      </div>
    </DashboardLayout>
  );
};

export default PaymentMethods;
