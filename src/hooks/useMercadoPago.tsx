import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface CardData {
  cardNumber: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  securityCode: string;
  identificationType: string;
  identificationNumber: string;
}

interface Installment {
  installments: number;
  installment_amount: number;
  total_amount: number;
  recommended_message: string;
}

interface UseMercadoPagoReturn {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  createCardToken: (cardData: CardData) => Promise<string | null>;
  getInstallments: (amount: number, bin: string) => Promise<Installment[]>;
  getCardBrand: (bin: string) => string | null;
}

export const useMercadoPago = (publicKey: string | null): UseMercadoPagoReturn => {
  const [mp, setMp] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setIsReady(false);
      return;
    }

    const initMercadoPago = () => {
      if (window.MercadoPago) {
        try {
          const mercadopago = new window.MercadoPago(publicKey, {
            locale: 'pt-BR'
          });
          setMp(mercadopago);
          setIsReady(true);
          setError(null);
          console.log('Mercado Pago SDK initialized');
        } catch (err) {
          console.error('Error initializing Mercado Pago:', err);
          setError('Erro ao inicializar Mercado Pago');
          setIsReady(false);
        }
      } else {
        // SDK not loaded yet, retry after a short delay
        setTimeout(initMercadoPago, 500);
      }
    };

    initMercadoPago();
  }, [publicKey]);

  const createCardToken = useCallback(async (cardData: CardData): Promise<string | null> => {
    if (!mp) {
      setError('Mercado Pago não inicializado');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cardTokenData = {
        cardNumber: cardData.cardNumber.replace(/\s/g, ''),
        cardholderName: cardData.cardholderName.toUpperCase(),
        cardExpirationMonth: cardData.expirationMonth.padStart(2, '0'),
        cardExpirationYear: cardData.expirationYear.length === 2 
          ? '20' + cardData.expirationYear 
          : cardData.expirationYear,
        securityCode: cardData.securityCode,
        identificationType: cardData.identificationType,
        identificationNumber: cardData.identificationNumber.replace(/\D/g, ''),
      };

      console.log('Creating card token with data:', { ...cardTokenData, securityCode: '***' });

      const response = await mp.createCardToken(cardTokenData);
      
      if (response.id) {
        console.log('Card token created:', response.id);
        return response.id;
      } else {
        throw new Error('Token não gerado');
      }
    } catch (err: any) {
      console.error('Error creating card token:', err);
      
      // Handle specific Mercado Pago errors
      const errorMessage = err.cause?.[0]?.description 
        || err.message 
        || 'Erro ao processar cartão';
      
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [mp]);

  const getInstallments = useCallback(async (amount: number, bin: string): Promise<Installment[]> => {
    if (!mp || bin.length < 6) {
      return [];
    }

    try {
      const response = await mp.getInstallments({
        amount: String(amount),
        bin: bin.substring(0, 6),
      });

      if (response && response[0]?.payer_costs) {
        return response[0].payer_costs.map((cost: any) => ({
          installments: cost.installments,
          installment_amount: cost.installment_amount,
          total_amount: cost.total_amount,
          recommended_message: cost.recommended_message,
        }));
      }
      
      return [];
    } catch (err) {
      console.error('Error getting installments:', err);
      return [];
    }
  }, [mp]);

  const getCardBrand = useCallback((bin: string): string | null => {
    if (bin.length < 4) return null;

    const firstDigits = bin.substring(0, 6);
    const firstTwo = bin.substring(0, 2);
    const firstFour = bin.substring(0, 4);

    // Visa
    if (bin.startsWith('4')) return 'visa';
    
    // Mastercard
    if (/^5[1-5]/.test(firstTwo) || /^2[2-7]/.test(firstTwo)) return 'master';
    
    // Elo
    if (/^(636368|438935|504175|451416|636297|5067|4576|4011|506699)/.test(firstDigits)) return 'elo';
    
    // Amex
    if (/^3[47]/.test(firstTwo)) return 'amex';
    
    // Hipercard
    if (/^(38|60)/.test(firstTwo) || firstFour === '6062') return 'hipercard';
    
    // Diners
    if (/^3(?:0[0-5]|[68])/.test(firstDigits.substring(0, 3))) return 'diners';

    return null;
  }, []);

  return {
    isReady,
    isLoading,
    error,
    createCardToken,
    getInstallments,
    getCardBrand,
  };
};
