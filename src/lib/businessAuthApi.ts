import { env } from "@/config/env";

const JSON_POST_HEADERS = {
  "Content-Type": "application/json",
  Accept: "application/json",
} as const;

const JSON_GET_HEADERS = {
  Accept: "application/json",
} as const;

export type LandingHint =
  | "docs_sdk_sandbox"
  | "dashboard_payments_flow"
  | "dashboard_payouts"
  | "docs_api_overview"
  | "dashboard_overview";

export class BusinessAuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = "BusinessAuthApiError";
  }
}

function extractErrorMessage(body: unknown, fallback: string): string {
  if (Array.isArray(body) && body.length > 0) {
    const msgs = body
      .filter(
        (item): item is { message?: string } =>
          item !== null && typeof item === "object"
      )
      .map((item) => item.message)
      .filter((m): m is string => typeof m === "string" && m.length > 0);
    if (msgs.length > 0) return msgs.join(" ");
  }
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    const msg = o.message;
    if (typeof msg === "string" && msg.length > 0) return msg;
    const err = o.error;
    if (typeof err === "string" && err.length > 0) return err;
    if (Array.isArray(o.message) && o.message.length > 0) {
      const first = o.message[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && "message" in first) {
        const joined = (o.message as { message?: string }[])
          .map((e) => e.message)
          .filter((m): m is string => typeof m === "string" && m.length > 0);
        if (joined.length > 0) return joined.join(" ");
      }
    }
  }
  return fallback;
}

/** Browser calls same-origin proxy to avoid CORS on localhost:4000. */
function resolveBusinessAuthUrl(path: string): string {
  const suffix = path.replace(/^\/api\/business-auth\/?/, "");
  if (typeof window !== "undefined") {
    return suffix
      ? `/api/core-business/${suffix}`
      : "/api/core-business";
  }
  return `${env.businessApiOrigin}${path}`;
}

async function requestJson(
  path: string,
  init: RequestInit & { method?: string }
): Promise<unknown> {
  const url = resolveBusinessAuthUrl(path);
  const method = (init.method ?? "GET").toUpperCase();
  const baseHeaders =
    method === "GET" ? JSON_GET_HEADERS : JSON_POST_HEADERS;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...baseHeaders,
      ...init.headers,
    },
  });

  const rawText = await res.text();
  let body: unknown = null;
  if (rawText) {
    try {
      body = JSON.parse(rawText) as unknown;
    } catch {
      body = rawText;
    }
  }

  if (!res.ok) {
    throw new BusinessAuthApiError(
      extractErrorMessage(body, res.statusText || "Request failed"),
      res.status,
      body
    );
  }

  return body;
}

const ACCESS_TOKEN_KEYS = [
  "accessToken",
  "access_token",
  "token",
  "jwt",
  "accessTokenJwt",
] as const;

function pickTokenFromRecord(rec: Record<string, unknown>): string | null {
  for (const key of ACCESS_TOKEN_KEYS) {
    const v = rec[key];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

/**
 * Core API may nest the JWT (e.g. `{ data: { accessToken } }`). Missing keys after
 * a 200 consume caused tokens to be burned in Redis while the client threw.
 */
function pickAccessToken(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  let found = pickTokenFromRecord(o);
  if (found) return found;
  for (const nest of ["data", "result", "session", "payload", "auth", "tokens"]) {
    const inner = o[nest];
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      found = pickTokenFromRecord(inner as Record<string, unknown>);
      if (found) return found;
    }
  }
  return null;
}

export interface BusinessAuthConfig {
  googleEnabled: boolean;
}

export async function fetchBusinessAuthConfig(): Promise<BusinessAuthConfig> {
  const body = await requestJson("/api/business-auth/config", { method: "GET" });
  if (!body || typeof body !== "object") {
    return { googleEnabled: false };
  }
  const o = body as Record<string, unknown>;
  return {
    googleEnabled: o.googleEnabled === true,
  };
}

export async function registerBusinessUser(input: {
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const body = await requestJson("/api/business-auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });
  const accessToken = pickAccessToken(body);
  if (!accessToken) {
    throw new BusinessAuthApiError(
      "Invalid response: missing access token",
      500,
      body
    );
  }
  return { accessToken };
}

/**
 * Password sign-in. If core uses a different path (e.g. login/password), update here.
 */
export async function loginBusinessWithPassword(input: {
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  const body = await requestJson("/api/business-auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    }),
  });
  const accessToken = pickAccessToken(body);
  if (!accessToken) {
    throw new BusinessAuthApiError(
      "Invalid response: missing access token",
      500,
      body
    );
  }
  return { accessToken };
}

export async function fetchBusinessPasskeyLoginOptions(
  email: string
): Promise<unknown> {
  return requestJson("/api/business-auth/login/passkey/options", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function verifyBusinessPasskeyLogin(input: {
  email: string;
  response: unknown;
}): Promise<{ accessToken: string }> {
  const body = await requestJson("/api/business-auth/login/passkey/verify", {
    method: "POST",
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      response: input.response,
    }),
  });
  const accessToken = pickAccessToken(body);
  if (!accessToken) {
    throw new BusinessAuthApiError(
      "Invalid response: missing access token",
      500,
      body
    );
  }
  return { accessToken };
}

export interface BusinessLoginCodeResult {
  code: string;
  redirectUrl: string | null;
  ttlSeconds: number;
}

/**
 * Exchange a portal access token for a short-lived, single-use login code.
 * The dashboard then trades that code back for the JWT.
 */
export async function createBusinessLoginCode(
  accessToken: string,
  redirectUrl?: string
): Promise<BusinessLoginCodeResult> {
  const body = await requestJson("/api/business-auth/login/code", {
    method: "POST",
    body: JSON.stringify({
      accessToken,
      redirectUrl,
    }),
  });

  if (!body || typeof body !== "object") {
    throw new BusinessAuthApiError(
      "Invalid response from login code endpoint",
      500,
      body
    );
  }

  const outer = body as Record<string, unknown>;
  const data =
    outer.data && typeof outer.data === "object" && !Array.isArray(outer.data)
      ? (outer.data as Record<string, unknown>)
      : outer;

  const rawCode = data.code;
  const rawRedirect = data.redirectUrl;
  const rawTtl = data.ttlSeconds;

  if (typeof rawCode !== "string" || rawCode.length === 0) {
    throw new BusinessAuthApiError(
      "Invalid login code response: missing code",
      500,
      body
    );
  }

  return {
    code: rawCode,
    redirectUrl:
      typeof rawRedirect === "string" && rawRedirect.length > 0
        ? rawRedirect
        : null,
    ttlSeconds:
      typeof rawTtl === "number" && Number.isFinite(rawTtl) && rawTtl > 0
        ? rawTtl
        : 60,
  };
}

export async function requestBusinessMagicLink(email: string): Promise<void> {
  await requestJson("/api/business-auth/magic-link/request", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export interface BusinessEmailCheckResult {
  available: boolean;
  registered: boolean;
  hasPassword: boolean;
}

function parseEmailCheckBody(body: unknown): BusinessEmailCheckResult | null {
  let o: Record<string, unknown> | null = null;
  if (body && typeof body === "object" && !Array.isArray(body)) {
    o = body as Record<string, unknown>;
    const data = o.data;
    if (data && typeof data === "object" && !Array.isArray(data)) {
      o = data as Record<string, unknown>;
    }
  }
  if (!o) return null;
  return {
    available: o.available === true,
    registered: o.registered === true,
    hasPassword: o.hasPassword === true,
  };
}

/**
 * Public: whether email is free for new signup or already registered (and if password login applies).
 */
export async function checkBusinessEmail(
  email: string
): Promise<BusinessEmailCheckResult> {
  const normalized = email.trim().toLowerCase();
  const path = `/api/business-auth/email/check?email=${encodeURIComponent(normalized)}`;
  const body = await requestJson(path, { method: "GET" });
  const parsed = parseEmailCheckBody(body);
  if (!parsed) {
    throw new BusinessAuthApiError(
      "Invalid response from email check",
      500,
      body
    );
  }
  return parsed;
}

function isLikelyJwt(value: string): boolean {
  const parts = value.split(".");
  return (
    parts.length === 3 &&
    parts.every((segment) => segment.length > 0) &&
    !value.includes(" ")
  );
}

function parseConsumeResponse(body: unknown): { accessToken: string } {
  const accessToken = pickAccessToken(body);
  if (!accessToken) {
    throw new BusinessAuthApiError(
      "Invalid response: missing access token",
      500,
      body
    );
  }
  return { accessToken };
}

/**
 * Email magic links use opaque tokens (often `?magic=`). OAuth uses JWT-shaped portal tokens.
 * Opaque values are sent as `{ magic }` first; some stacks only accept `{ token }`.
 */
export async function consumeBusinessMagicLink(
  token: string
): Promise<{ accessToken: string }> {
  const trimmed = token.trim();

  if (isLikelyJwt(trimmed)) {
    const body = await requestJson("/api/business-auth/magic-link/consume", {
      method: "POST",
      body: JSON.stringify({ token: trimmed }),
    });
    return parseConsumeResponse(body);
  }

  try {
    const body = await requestJson("/api/business-auth/magic-link/consume", {
      method: "POST",
      body: JSON.stringify({ magic: trimmed }),
    });
    return parseConsumeResponse(body);
  } catch (first: unknown) {
    const err = first instanceof BusinessAuthApiError ? first : null;
    if (err && err.status >= 400 && err.status < 500) {
      const body = await requestJson("/api/business-auth/magic-link/consume", {
        method: "POST",
        body: JSON.stringify({ token: trimmed }),
      });
      return parseConsumeResponse(body);
    }
    throw first;
  }
}

const portalTokenPromises = new Map<
  string,
  Promise<{ accessToken: string }>
>();

/**
 * Deduplicates portal/magic-link consumption (e.g. React Strict Mode double mount).
 */
export function consumePortalOrMagicTokenOnce(
  token: string
): Promise<{ accessToken: string }> {
  const key = token.trim();
  let pending = portalTokenPromises.get(key);
  if (!pending) {
    pending = consumeBusinessMagicLink(key).catch((err) => {
      portalTokenPromises.delete(key);
      throw err;
    });
    portalTokenPromises.set(key, pending);
  }
  return pending;
}

export function getGoogleOAuthStartUrl(): string {
  return `${env.businessApiOrigin}/api/business-auth/google/start`;
}

export async function submitOnboardingEntity(
  accessToken: string,
  input: { companyName: string; website?: string }
): Promise<void> {
  const payload: { companyName: string; website?: string } = {
    companyName: input.companyName.trim(),
  };
  const w = input.website?.trim();
  if (w) payload.website = w;

  await requestJson("/api/business-auth/onboarding/entity", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export interface OnboardingCompleteResult {
  accessToken: string;
  landingHint: LandingHint | string;
}

export async function completeBusinessOnboarding(
  accessToken: string,
  input: { signupRole: string; primaryGoal: string }
): Promise<OnboardingCompleteResult> {
  const body = await requestJson("/api/business-auth/onboarding/complete", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      signupRole: input.signupRole,
      primaryGoal: input.primaryGoal,
    }),
  });

  if (!body || typeof body !== "object") {
    throw new BusinessAuthApiError(
      "Invalid response from onboarding complete",
      500,
      body
    );
  }

  const o = body as Record<string, unknown>;
  const newToken = pickAccessToken(body) ?? accessToken;
  const landingHint =
    typeof o.landingHint === "string" ? o.landingHint : "dashboard_overview";

  return {
    accessToken: newToken,
    landingHint,
  };
}

export interface BusinessSession {
  portalDisplayName: string | null;
  hasPassword: boolean;
  passkeyCount: number;
  profileComplete: boolean;
}

export async function fetchBusinessSession(
  accessToken: string
): Promise<BusinessSession> {
  const body = await requestJson("/api/business-auth/session", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!body || typeof body !== "object") {
    throw new BusinessAuthApiError(
      "Invalid response from business session",
      500,
      body
    );
  }

  const o = body as Record<string, unknown>;

  return {
    portalDisplayName:
      typeof o.portalDisplayName === "string" ? o.portalDisplayName : null,
    hasPassword: o.hasPassword === true,
    passkeyCount:
      typeof o.passkeyCount === "number" && Number.isFinite(o.passkeyCount)
        ? o.passkeyCount
        : 0,
    profileComplete: o.profileComplete === true,
  };
}

/**
 * Final signup step: display name + password after email was verified via magic link.
 * Core now exposes POST /api/business-auth/profile/setup.
 */
export async function submitBusinessProfileSetup(
  accessToken: string,
  input: { displayName: string; password?: string }
): Promise<void> {
  const payload: { displayName: string; password?: string } = {
    displayName: input.displayName.trim(),
  };

  if (input.password && input.password.length > 0) {
    payload.password = input.password;
  }

  await requestJson("/api/business-auth/profile/setup", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function fetchBusinessPasskeyRegistrationOptions(
  accessToken: string
): Promise<unknown> {
  return requestJson("/api/business-auth/passkey/registration-options", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function registerBusinessPasskey(
  accessToken: string,
  input: { response: unknown; passkeyName?: string }
): Promise<void> {
  const payload: { response: unknown; passkeyName?: string } = {
    response: input.response,
  };

  const name = input.passkeyName?.trim();
  if (name) {
    payload.passkeyName = name;
  }

  await requestJson("/api/business-auth/passkey/register", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}
