import { useMemo } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import Checkout from '@/pages/Checkout';

const DomainRouter = () => {
  const [searchParams] = useSearchParams();
  
  const isCustomDomain = useMemo(() => {
    const hostname = window.location.hostname;
    const ignoredDomains = ['localhost', 'lovable.app', 'gatteflow.store', '127.0.0.1', 'lovableproject.com'];
    return !ignoredDomains.some(d => hostname.includes(d));
  }, []);

  // Check for checkout query params (?s= or ?id=)
  const hasCheckoutParams = searchParams.get('s') || searchParams.get('id');

  // Se for domínio personalizado OU tiver params de checkout, renderiza Checkout
  if (isCustomDomain || hasCheckoutParams) {
    return <Checkout />;
  }

  // Se for domínio principal sem params, redireciona para auth
  return <Navigate to="/auth" replace />;
};

export default DomainRouter;
