import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, AlertTriangle } from "lucide-react";

interface TermsOfServiceProps {
  mode: "platform_gateway" | "own_gateway";
  accepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
}

export function TermsOfService({ mode, accepted, onAcceptChange }: TermsOfServiceProps) {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Termos de Uso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-64 w-full rounded-md border p-4">
          <div className="space-y-4 text-sm text-muted-foreground">
            <h3 className="font-semibold text-foreground">TERMOS E CONDIÇÕES DE USO DA PLATAFORMA GATEFLOW</h3>
            
            <p>
              Ao utilizar os serviços da plataforma Gateflow, você declara ter lido, compreendido e aceito 
              integralmente os presentes Termos de Uso.
            </p>

            <h4 className="font-semibold text-foreground mt-4">1. DEFINIÇÕES</h4>
            <p>
              <strong>Plataforma:</strong> Sistema Gateflow de gestão de vendas e pagamentos online.<br />
              <strong>Usuário/Vendedor:</strong> Pessoa física ou jurídica que utiliza a plataforma para comercializar produtos.<br />
              <strong>Gateway de Pagamento:</strong> Sistema de processamento de transações financeiras.
            </p>

            {mode === "platform_gateway" && (
              <>
                <h4 className="font-semibold text-foreground mt-4 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  2. AVISO IMPORTANTE - GATEWAY DA PLATAFORMA (BSPAY)
                </h4>
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-600 dark:text-yellow-400">
                    Ao optar pelo Gateway da Plataforma Gateflow (processado pela BSPAY), você declara estar 
                    ciente de que:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-yellow-600 dark:text-yellow-400">
                    <li>Os valores das suas vendas serão processados e mantidos pela BSPAY até a solicitação de saque.</li>
                    <li>A Gateflow atua apenas como intermediária tecnológica.</li>
                    <li>A Gateflow NÃO se responsabiliza por eventuais problemas, atrasos ou indisponibilidades 
                        relacionados à custódia dos valores pela BSPAY.</li>
                    <li>Para dúvidas sobre seus recursos, entre em contato diretamente com a BSPAY.</li>
                    <li>Os saques serão processados manualmente mediante solicitação e estão sujeitos à taxa de R$ 5,00.</li>
                  </ul>
                </div>
              </>
            )}

            <h4 className="font-semibold text-foreground mt-4">3. TAXAS E COBRANÇAS</h4>
            {mode === "platform_gateway" ? (
              <p>
                Ao utilizar o Gateway da Plataforma, será cobrada uma taxa de <strong>5,99% + R$ 1,00</strong> por 
                venda aprovada, descontada automaticamente no momento da transação. O saque possui uma taxa 
                de <strong>R$ 5,00</strong> por solicitação.
              </p>
            ) : (
              <p>
                Ao utilizar seu próprio Gateway/Banco, será cobrada uma taxa de <strong>3,99% + R$ 1,00</strong> por 
                venda aprovada. O pagamento das taxas deve ser realizado semanalmente, toda segunda-feira, 
                via PIX. O não pagamento pode resultar no bloqueio temporário da conta.
              </p>
            )}

            <h4 className="font-semibold text-foreground mt-4">4. RESPONSABILIDADES DO USUÁRIO</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Manter seus dados cadastrais atualizados</li>
              <li>Garantir a legalidade dos produtos comercializados</li>
              <li>Cumprir com todas as obrigações fiscais aplicáveis</li>
              <li>Não utilizar a plataforma para atividades ilícitas</li>
              <li>Manter a segurança de suas credenciais de acesso</li>
            </ul>

            <h4 className="font-semibold text-foreground mt-4">5. LIMITAÇÃO DE RESPONSABILIDADE</h4>
            <p>
              A Gateflow não se responsabiliza por:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Danos decorrentes de uso indevido da plataforma</li>
              <li>Problemas técnicos de terceiros (gateways, bancos, etc.)</li>
              <li>Perdas financeiras por decisões comerciais do usuário</li>
              <li>Indisponibilidade temporária dos serviços para manutenção</li>
            </ul>

            <h4 className="font-semibold text-foreground mt-4">6. DISPOSIÇÕES GERAIS</h4>
            <p>
              A Gateflow reserva-se o direito de modificar estes termos a qualquer momento, 
              mediante notificação prévia aos usuários. O uso continuado da plataforma após 
              alterações constitui aceite das novas condições.
            </p>

            <p className="text-xs text-muted-foreground mt-6">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>
          </div>
        </ScrollArea>

        <div className="flex items-start space-x-3 pt-4 border-t">
          <Checkbox
            id="terms"
            checked={accepted}
            onCheckedChange={(checked) => onAcceptChange(checked === true)}
          />
          <label
            htmlFor="terms"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
          >
            Li e aceito os Termos de Uso da plataforma Gateflow
            {mode === "platform_gateway" && (
              <span className="text-yellow-600 dark:text-yellow-400">
                {" "}e estou ciente das condições do Gateway BSPAY
              </span>
            )}
          </label>
        </div>
      </CardContent>
    </Card>
  );
}
