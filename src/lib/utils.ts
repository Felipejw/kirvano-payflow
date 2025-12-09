import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um valor numérico para moeda brasileira (R$)
 * @param value - Valor numérico a ser formatado
 * @param showSymbol - Se deve mostrar o símbolo R$ (padrão: true)
 * @returns String formatada no padrão brasileiro (ex: R$ 1.234,56)
 */
export function formatCurrency(value: number, showSymbol: boolean = true): string {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return showSymbol ? `R$ ${formatted}` : formatted;
}

/**
 * Formata um valor numérico para moeda brasileira sem o símbolo
 * @param value - Valor numérico a ser formatado
 * @returns String formatada no padrão brasileiro (ex: 1.234,56)
 */
export function formatCurrencyValue(value: number): string {
  return formatCurrency(value, false);
}
