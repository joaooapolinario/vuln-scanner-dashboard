import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "COMPLETED":
      return "default";
    case "PROCESSING":
      return "secondary";
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
};

