import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Timer, Package } from "lucide-react";

interface CheckoutTemplate {
  id: string;
  name: string;
  primary_color?: string;
  background_color?: string;
  text_color?: string;
  button_color?: string;
  button_text_color?: string;
  border_radius?: string;
  show_timer?: boolean;
  enable_timer?: boolean;
  timer_text?: string;
  show_security_badge?: boolean;
  show_guarantee?: boolean;
  guarantee_text?: string;
  logo_url?: string;
}

interface CheckoutTemplatePreviewProps {
  template: CheckoutTemplate | null;
  productName?: string;
  productPrice?: number;
}

export function CheckoutTemplatePreview({ template, productName = "Produto", productPrice = 97 }: CheckoutTemplatePreviewProps) {
  if (!template) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Checkout padrão será utilizado</p>
      </div>
    );
  }

  const bgColor = template.background_color || '#0a1628';
  const textColor = template.text_color || '#ffffff';
  const primaryColor = template.primary_color || '#00b4d8';
  const buttonColor = template.button_color || '#00b4d8';
  const buttonTextColor = template.button_text_color || '#0a1628';
  const borderRadius = template.border_radius || '12';

  return (
    <div 
      className="rounded-lg overflow-hidden border border-border"
      style={{ 
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between">
          {template.logo_url ? (
            <img src={template.logo_url} alt="Logo" className="h-6 object-contain" />
          ) : (
            <span className="font-semibold text-sm" style={{ color: primaryColor }}>
              {template.name}
            </span>
          )}
          {template.enable_timer && (
            <div className="flex items-center gap-1 text-xs" style={{ color: primaryColor }}>
              <Timer className="h-3 w-3" />
              <span>15:00</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Product Preview */}
        <div className="flex gap-2 items-center">
          <div 
            className="w-10 h-10 rounded flex items-center justify-center text-xs"
            style={{ backgroundColor: primaryColor + '20', borderRadius: borderRadius + 'px' }}
          >
            <Package className="h-4 w-4" style={{ color: primaryColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{productName}</p>
            <p className="text-xs font-bold" style={{ color: primaryColor }}>
              R$ {productPrice.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Mini Form */}
        <div className="space-y-2">
          <div className="space-y-1">
            <Label className="text-[10px]" style={{ color: textColor + 'aa' }}>Nome</Label>
            <div 
              className="h-6 rounded border border-white/20"
              style={{ borderRadius: borderRadius + 'px' }}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px]" style={{ color: textColor + 'aa' }}>Email</Label>
            <div 
              className="h-6 rounded border border-white/20"
              style={{ borderRadius: borderRadius + 'px' }}
            />
          </div>
        </div>

        {/* Button */}
        <button
          className="w-full py-2 text-xs font-semibold"
          style={{ 
            backgroundColor: buttonColor,
            color: buttonTextColor,
            borderRadius: borderRadius + 'px',
          }}
        >
          Pagar com PIX
        </button>

        {/* Badges */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {template.show_security_badge && (
            <div className="flex items-center gap-1 text-[9px]" style={{ color: textColor + '99' }}>
              <Shield className="h-3 w-3" />
              <span>Seguro</span>
            </div>
          )}
          {template.show_guarantee && (
            <div className="flex items-center gap-1 text-[9px]" style={{ color: textColor + '99' }}>
              <span>✓ Garantia</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
