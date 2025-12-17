import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Lock, Eye, EyeOff } from 'lucide-react';

interface CardBrandIconProps {
  brand: string | null;
}

const CardBrandIcon = ({ brand }: CardBrandIconProps) => {
  const brandLogos: Record<string, string> = {
    visa: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg',
    master: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg',
    elo: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Elo_logo.svg',
    amex: 'https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo_%282018%29.svg',
    hipercard: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Hipercard_logo.svg',
    diners: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Diners_Club_Logo3.svg',
  };

  if (!brand || !brandLogos[brand]) {
    return <CreditCard className="h-5 w-5 text-muted-foreground" />;
  }

  return (
    <img 
      src={brandLogos[brand]} 
      alt={brand} 
      className="h-6 w-auto"
    />
  );
};

interface Installment {
  installments: number;
  installment_amount: number;
  total_amount: number;
  recommended_message: string;
}

interface CreditCardFormProps {
  cardNumber: string;
  setCardNumber: (value: string) => void;
  cardName: string;
  setCardName: (value: string) => void;
  cardExpiry: string;
  setCardExpiry: (value: string) => void;
  cardCvv: string;
  setCardCvv: (value: string) => void;
  installments: number;
  setInstallments: (value: number) => void;
  installmentOptions: Installment[];
  cardBrand: string | null;
  styles: {
    textColor: string;
    cardBg: string;
    cardBorder: string;
    accentColor: string;
  };
}

export const CreditCardForm = ({
  cardNumber,
  setCardNumber,
  cardName,
  setCardName,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
  installments,
  setInstallments,
  installmentOptions,
  cardBrand,
  styles,
}: CreditCardFormProps) => {
  const [showCvv, setShowCvv] = useState(false);

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    return formatted;
  };

  // Format expiry date MM/AA
  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) {
      return digits.slice(0, 2) + '/' + digits.slice(2);
    }
    return digits;
  };

  // Format CVV (3 or 4 digits for Amex)
  const formatCvv = (value: string) => {
    const maxLength = cardBrand === 'amex' ? 4 : 3;
    return value.replace(/\D/g, '').slice(0, maxLength);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Card Number */}
      <div className="space-y-2">
        <Label 
          htmlFor="cardNumber" 
          className="text-sm font-medium"
          style={{ color: styles.textColor }}
        >
          Número do Cartão
        </Label>
        <div className="relative">
          <Input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            placeholder="0000 0000 0000 0000"
            value={cardNumber}
            onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
            className="pr-12"
            style={{
              backgroundColor: styles.cardBg,
              borderColor: styles.cardBorder,
              color: styles.textColor,
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CardBrandIcon brand={cardBrand} />
          </div>
        </div>
      </div>

      {/* Cardholder Name */}
      <div className="space-y-2">
        <Label 
          htmlFor="cardName" 
          className="text-sm font-medium"
          style={{ color: styles.textColor }}
        >
          Nome no Cartão
        </Label>
        <Input
          id="cardName"
          type="text"
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          value={cardName}
          onChange={(e) => setCardName(e.target.value.toUpperCase())}
          style={{
            backgroundColor: styles.cardBg,
            borderColor: styles.cardBorder,
            color: styles.textColor,
          }}
        />
      </div>

      {/* Expiry and CVV Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label 
            htmlFor="cardExpiry" 
            className="text-sm font-medium"
            style={{ color: styles.textColor }}
          >
            Validade
          </Label>
          <Input
            id="cardExpiry"
            type="text"
            inputMode="numeric"
            placeholder="MM/AA"
            value={cardExpiry}
            onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
            style={{
              backgroundColor: styles.cardBg,
              borderColor: styles.cardBorder,
              color: styles.textColor,
            }}
          />
        </div>
        <div className="space-y-2">
          <Label 
            htmlFor="cardCvv" 
            className="text-sm font-medium"
            style={{ color: styles.textColor }}
          >
            CVV
          </Label>
          <div className="relative">
            <Input
              id="cardCvv"
              type={showCvv ? 'text' : 'password'}
              inputMode="numeric"
              placeholder={cardBrand === 'amex' ? '0000' : '000'}
              value={cardCvv}
              onChange={(e) => setCardCvv(formatCvv(e.target.value))}
              className="pr-10"
              style={{
                backgroundColor: styles.cardBg,
                borderColor: styles.cardBorder,
                color: styles.textColor,
              }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2"
              onClick={() => setShowCvv(!showCvv)}
            >
              {showCvv ? (
                <EyeOff className="h-4 w-4" style={{ color: styles.textColor, opacity: 0.6 }} />
              ) : (
                <Eye className="h-4 w-4" style={{ color: styles.textColor, opacity: 0.6 }} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Installments */}
      {installmentOptions.length > 0 && (
        <div className="space-y-2">
          <Label 
            htmlFor="installments" 
            className="text-sm font-medium"
            style={{ color: styles.textColor }}
          >
            Parcelas
          </Label>
          <Select 
            value={String(installments)} 
            onValueChange={(val) => setInstallments(parseInt(val))}
          >
            <SelectTrigger 
              style={{
                backgroundColor: styles.cardBg,
                borderColor: styles.cardBorder,
                color: styles.textColor,
              }}
            >
              <SelectValue placeholder="Selecione as parcelas" />
            </SelectTrigger>
            <SelectContent>
              {installmentOptions.map((opt) => (
                <SelectItem key={opt.installments} value={String(opt.installments)}>
                  {opt.installments}x de {formatCurrency(opt.installment_amount)}
                  {opt.installments > 1 && ` (Total: ${formatCurrency(opt.total_amount)})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Security Badge */}
      <div 
        className="flex items-center gap-2 p-3 rounded-lg"
        style={{ backgroundColor: styles.accentColor + '15' }}
      >
        <Lock className="h-4 w-4" style={{ color: styles.accentColor }} />
        <span className="text-xs" style={{ color: styles.textColor, opacity: 0.8 }}>
          Seus dados estão protegidos com criptografia SSL
        </span>
      </div>
    </div>
  );
};
