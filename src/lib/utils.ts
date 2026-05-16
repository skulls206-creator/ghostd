import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCrypto(val: number | undefined | null, decimals: number = 4) {
  if (val === undefined || val === null) return "0.00";
  const maxDec = Math.max(0, decimals);
  const minDec = Math.min(2, maxDec);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: minDec,
    maximumFractionDigits: maxDec,
  }).format(val);
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
