import { apiFetch } from "@/lib/apiFetch";

export type ErrorType<T = unknown> = Error;

export type BodyType<T> = T;

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

// API base URL is injected at build time via VITE_API_BASE_URL.
// This value is static after build — a rebuild is required if the API URL changes.
// See README.md for deployment instructions.
const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");

function resolveInput(input: RequestInfo | URL): RequestInfo | URL {
  if (typeof input === "string" && API_BASE && input.startsWith("/")) {
    return API_BASE + input;
  }
  return input;
}

export async function customFetch<T = unknown>(
  input: RequestInfo | URL,
  options?: RequestInit,
): Promise<T> {
  const method = (options?.method ?? "GET").toUpperCase();
  const url = resolveUrl(resolveInput(input));

  const headers = new Headers(options?.headers);
  if (
    typeof options?.body === "string" &&
    !headers.has("content-type") &&
    (options.body.trimStart().startsWith("{") || options.body.trimStart().startsWith("["))
  ) {
    headers.set("content-type", "application/json");
  }

  const response = await apiFetch(url, {
    ...options,
    method,
    headers,
  });

  if (!response.ok) {
    let errorData: unknown = null;
    try {
      errorData = await response.json();
    } catch {
      try {
        errorData = await response.text();
      } catch {}
    }
    throw new Error(
      `HTTP ${response.status} ${response.statusText}` +
        (errorData ? `: ${JSON.stringify(errorData).slice(0, 200)}` : ""),
    );
  }

  // Try JSON first, fall back to text
  const text = await response.text();
  if (!text) return null as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
