import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Checkout from '@/pages/Checkout';
import Auth from '@/pages/Auth';
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

  // TEMPORÁRIO: Mostra tela de login em vez da landing page
  return <Auth />;
};

export default DomainRouter;
