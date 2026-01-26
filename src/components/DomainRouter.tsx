import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Checkout from '@/pages/Checkout';
import Index from '@/pages/Index';
import { isCustomDomain as isCustomDomainHost } from '@/lib/domain';

const DomainRouter = () => {
  const [searchParams] = useSearchParams();
  
  const isCustomDomain = useMemo(() => isCustomDomainHost(), []);
  
  // Verificar TODOS os formatos de params de checkout
  const hasCheckoutParams = 
    searchParams.has('productId') || 
    searchParams.has('id') ||
    searchParams.has('slug') || 
    searchParams.has('s');
  
  // Se for domínio customizado ou tiver params de checkout, mostra checkout
  if (isCustomDomain || hasCheckoutParams) {
    return <Checkout />;
  }

  // Se for domínio principal sem params, mostra a landing page
  return <Index />;
};

export default DomainRouter;
