import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { v4 as uuidv4 } from "uuid";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Session Management for anonymous users
const SESSION_KEY = "cg-session-id";

export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = uuidv4();
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

export function formatRiskScore(score: number): string {
  return score.toFixed(1) + "%";
}

export function getRiskColor(level: string) {
  switch (level?.toLowerCase()) {
    case 'low': return 'text-success bg-success/10 border-success/20';
    case 'moderate': return 'text-warning bg-warning/10 border-warning/20';
    case 'high': return 'text-accent bg-accent/10 border-accent/20';
    case 'very_high': return 'text-destructive bg-destructive/10 border-destructive/20';
    default: return 'text-muted-foreground bg-muted border-muted-foreground/20';
  }
}
