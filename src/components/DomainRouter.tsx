import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import Checkout from '@/pages/Checkout';

const DomainRouter = () => {
  const isCustomDomain = useMemo(() => {
    const hostname = window.location.hostname;
    const ignoredDomains = ['localhost', 'lovable.app', 'gateflow.store', '127.0.0.1', 'lovableproject.com'];
    return !ignoredDomains.some(d => hostname.includes(d));
  }, []);

  // Se for domínio personalizado, renderiza Checkout direto na raiz
  if (isCustomDomain) {
    return <Checkout />;
  }

  // Se for domínio principal, redireciona para auth
  return <Navigate to="/auth" replace />;
};

export default DomainRouter;
