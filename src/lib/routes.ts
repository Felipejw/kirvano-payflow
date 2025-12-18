import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useCallback } from "react";

// All app pages and their display paths
export const PAGES = {
  // Landing/Public
  home: "",
  auth: "auth",
  checkout: "checkout",
  
  // Dashboard
  dashboard: "dashboard",
  products: "dashboard/products",
  sales: "dashboard/sales",
  transactions: "dashboard/transactions",
  clients: "dashboard/clients",
  members: "dashboard/members",
  membersConfig: "dashboard/members/config",
  recovery: "dashboard/recovery",
  withdrawals: "dashboard/withdrawals",
  paymentMethods: "dashboard/payment-methods",
  finance: "dashboard/finance",
  settings: "dashboard/settings",
  suggestions: "dashboard/suggestions",
  
  // Admin
  admin: "admin",
  adminReceita: "admin/receita",
  adminVendas: "admin/vendas",
  adminRankings: "admin/rankings",
  adminUsers: "admin/users",
  adminProducts: "admin/products",
  adminTransactions: "admin/transactions",
  adminWithdrawals: "admin/withdrawals",
  adminInvoices: "admin/invoices",
  adminGateways: "admin/gateways",
  adminAnalytics: "admin/analytics",
  adminSuggestions: "admin/suggestions",
  adminSettings: "admin/settings",
  adminRecovery: "admin/recovery",
  adminInstagramPosts: "admin/instagram-posts",
  
  // Members Area (public)
  membersArea: "members",
  membersLogin: "members/login",
  memberProduct: "members/product",
} as const;

export type PageKey = keyof typeof PAGES;

/**
 * Get URL for a page with optional params
 */
export function getPageUrl(page: string, params?: Record<string, string>): string {
  if (!page) return "/";
  
  let url = `/?page=${page}`;
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url += `&${key}=${encodeURIComponent(value)}`;
    });
  }
  
  return url;
}

/**
 * Get current page from URL
 */
export function getCurrentPage(): string {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") || "";
}

/**
 * Get URL param
 */
export function getUrlParam(key: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

/**
 * Hook to navigate using query params
 */
export function useAppNavigate() {
  const navigate = useNavigate();
  
  return useCallback((page: string, params?: Record<string, string>) => {
    if (!page || page === "/") {
      navigate("/");
      return;
    }
    
    // If page starts with http, it's an external URL
    if (page.startsWith("http")) {
      window.location.href = page;
      return;
    }
    
    // If page starts with #, it's an anchor
    if (page.startsWith("#")) {
      window.location.hash = page;
      return;
    }
    
    const url = getPageUrl(page, params);
    navigate(url);
  }, [navigate]);
}

/**
 * Hook to get current page
 */
export function useCurrentPage() {
  const [searchParams] = useSearchParams();
  return searchParams.get("page") || "";
}

/**
 * Check if current page matches
 */
export function useIsActivePage(page: string): boolean {
  const currentPage = useCurrentPage();
  if (!page) return !currentPage;
  return currentPage === page;
}
