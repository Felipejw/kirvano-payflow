import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Checkout from '@/pages/Checkout';
import Index from '@/pages/Index';
import { isCustomDomain as isCustomDomainHost } from '@/lib/domain';

const DomainRouter = () => {
  const [searchParams] = useSearchParams();
  
  const isCustomDomain = useMemo(() => isCustomDomainHost(), []);

  // Check for checkout query params (?s= or ?id=)
  const hasCheckoutParams = searchParams.get('s') || searchParams.get('id');

  // Se for domínio personalizado OU tiver params de checkout, renderiza Checkout
  if (isCustomDomain || hasCheckoutParams) {
    return <Checkout />;
  }

  // Se for domínio principal sem params, mostra a landing page
  return <Index />;
};

export default DomainRouter;
