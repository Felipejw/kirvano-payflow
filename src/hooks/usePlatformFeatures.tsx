import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface PlatformFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  is_enabled: boolean;
  icon: string | null;
  menu_page: string | null;
  category: string;
  display_order: number;
}

interface UsePlatformFeaturesReturn {
  features: PlatformFeature[];
  loading: boolean;
  isFeatureEnabled: (featureKey: string) => boolean;
  isMenuPageEnabled: (menuPage: string) => boolean;
  refetch: () => Promise<void>;
}

// Cache global para evitar múltiplas queries
let cachedFeatures: PlatformFeature[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const usePlatformFeatures = (): UsePlatformFeaturesReturn => {
  const [features, setFeatures] = useState<PlatformFeature[]>(cachedFeatures || []);
  const [loading, setLoading] = useState(!cachedFeatures);

  const fetchFeatures = async () => {
    // Usar cache se ainda válido
    if (cachedFeatures && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setFeatures(cachedFeatures);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("platform_features")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching platform features:", error);
        return;
      }

      cachedFeatures = data || [];
      cacheTimestamp = Date.now();
      setFeatures(cachedFeatures);
    } catch (error) {
      console.error("Error fetching platform features:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const isFeatureEnabled = (featureKey: string): boolean => {
    const feature = features.find((f) => f.feature_key === featureKey);
    return feature?.is_enabled ?? true; // Default to enabled if not found
  };

  const isMenuPageEnabled = (menuPage: string): boolean => {
    const feature = features.find((f) => f.menu_page === menuPage);
    return feature?.is_enabled ?? true; // Default to enabled if not found
  };

  const refetch = async () => {
    cachedFeatures = null;
    cacheTimestamp = 0;
    await fetchFeatures();
  };

  return {
    features,
    loading,
    isFeatureEnabled,
    isMenuPageEnabled,
    refetch,
  };
};

// Função para invalidar cache (útil após atualizar features)
export const invalidateFeaturesCache = () => {
  cachedFeatures = null;
  cacheTimestamp = 0;
};
