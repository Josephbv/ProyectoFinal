import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanCedula(cedula: string | null | undefined): string {
  if (!cedula) return "";
  return cedula.replace(/-[CEce]$/, "");
}

export function cleanEmail(email: string | null | undefined): string {
  if (!email) return "";
  return email.replace(/-[CEce]@/, "@");
}
