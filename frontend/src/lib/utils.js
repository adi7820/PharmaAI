import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Extract error message from API error response (handles Pydantic validation errors)
export function getErrorMessage(err, fallback = "Something went wrong") {
  const detail = err?.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    // Pydantic validation error format: [{type, loc, msg, input, url}]
    return detail.map(e => e.msg || e.message || "Validation error").join(", ");
  }
  return fallback;
}
