"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { Fingerprint, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BusinessAuthApiError,
  createBusinessLoginCode,
  fetchBusinessAuthConfig,
  fetchBusinessPasskeyLoginOptions,
  getGoogleOAuthStartUrl,
  loginBusinessWithPassword,
  requestBusinessMagicLink,
  verifyBusinessPasskeyLogin,
} from "@/lib/businessAuthApi";
import { cn } from "@/lib/utils";
import { env } from "@/config/env";

const MAGIC_COOLDOWN_SECONDS = 30;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function formatApiError(error: unknown): string {
  if (error instanceof BusinessAuthApiError) return error.message;
  const msg =
    error instanceof TypeError || error instanceof Error
      ? error.message
      : "";
  if (
    msg === "Failed to fetch" ||
    msg === "Load failed" ||
    msg.toLowerCase().includes("network")
  ) {
    return "Network error: could not reach the auth API (check the dev server and that POST /api/business-auth/login/code exists on core). If the dashboard is on HTTPS with a self-signed cert, open it once in the browser to trust it.";
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

function buildDashboardRedirectUrl(baseUrl: string, code: string): string {
  const trimmed = baseUrl.trim();
  if (!trimmed) {
    throw new Error(
      "NEXT_PUBLIC_BUSINESS_DASHBOARD_URL is not set. Example: https://localhost:3002/app"
    );
  }
  let url: URL;
  try {
    if (/^https?:\/\//i.test(trimmed)) {
      url = new URL(trimmed);
    } else {
      url = new URL(`https://${trimmed}`);
    }
  } catch {
    throw new Error(
      `Invalid dashboard URL "${trimmed}". Use a full URL (e.g. https://localhost:3002/app).`
    );
  }
  url.searchParams.set("login_code", code);
  return url.toString();
}

/**
 * Creates a login code; retries without redirectUrl if core rejects the URL (allowlist).
 */
async function handoffToDashboardWithLoginCode(accessToken: string): Promise<void> {
  const dashboardBase = env.businessDashboardUrl;
  let result: Awaited<ReturnType<typeof createBusinessLoginCode>>;
  try {
    result = await createBusinessLoginCode(accessToken, dashboardBase);
  } catch (first: unknown) {
    const err = first instanceof BusinessAuthApiError ? first : null;
    if (err && (err.status === 400 || err.status === 422)) {
      result = await createBusinessLoginCode(accessToken);
    } else {
      throw first;
    }
  }
  const base = result.redirectUrl?.trim() || dashboardBase;
  window.location.assign(buildDashboardRedirectUrl(base, result.code));
}

export function BusinessSigninFlow() {
  const formId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [magicCooldown, setMagicCooldown] = useState(0);
  const [magicSent, setMagicSent] = useState(false);
  const [isPasskeySigningIn, setIsPasskeySigningIn] = useState(false);

  useEffect(() => {
    fetchBusinessAuthConfig()
      .then((c) => setGoogleEnabled(c.googleEnabled))
      .catch(() => setGoogleEnabled(false));
  }, []);

  useEffect(() => {
    if (magicCooldown <= 0) return;
    const id = window.setInterval(() => {
      setMagicCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [magicCooldown > 0]);

  const clearError = useCallback(() => setFormError(null), []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (!isValidEmail(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!password.trim()) {
      setFormError("Enter your password.");
      return;
    }
    setIsSubmitting(true);
    try {
      const { accessToken } = await loginBusinessWithPassword({
        email,
        password,
      });
      await handoffToDashboardWithLoginCode(accessToken);
    } catch (err: unknown) {
      const apiErr = err instanceof BusinessAuthApiError ? err : null;
      if (apiErr?.status === 401 || apiErr?.status === 403) {
        setFormError("Incorrect email or password.");
      } else {
        setFormError(formatApiError(err));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMagicLink = async () => {
    clearError();
    setMagicSent(false);
    if (!isValidEmail(email)) {
      setFormError("Enter your email to receive a sign-in link.");
      return;
    }
    setIsSubmitting(true);
    try {
      await requestBusinessMagicLink(email);
      setMagicCooldown(MAGIC_COOLDOWN_SECONDS);
      setMagicSent(true);
    } catch (err: unknown) {
      setFormError(formatApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = () => {
    clearError();
    window.location.href = getGoogleOAuthStartUrl();
  };

  const handlePasskeySignIn = async () => {
    clearError();
    if (!isValidEmail(email)) {
      setFormError("Enter your email, then sign in with a passkey.");
      return;
    }
    if (typeof window === "undefined" || !("PublicKeyCredential" in window)) {
      setFormError(
        "Passkeys are not supported in this browser. Try Chrome, Safari, or Edge."
      );
      return;
    }
    setIsPasskeySigningIn(true);
    try {
      const optionsJSON = await fetchBusinessPasskeyLoginOptions(email);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { startAuthentication } = require("@simplewebauthn/browser") as {
        startAuthentication: (opts: {
          optionsJSON: typeof optionsJSON;
        }) => Promise<unknown>;
      };
      const response = await startAuthentication({ optionsJSON });
      const { accessToken } = await verifyBusinessPasskeyLogin({
        email,
        response,
      });
      await handoffToDashboardWithLoginCode(accessToken);
    } catch (err: unknown) {
      setFormError(formatApiError(err));
    } finally {
      setIsPasskeySigningIn(false);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col bg-zinc-50 text-zinc-900">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
        <section
          className="w-full max-w-lg"
          aria-labelledby={`${formId}-title`}
        >
          <h1
            id={`${formId}-title`}
            className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl [font-family:var(--font-inter-tight),ui-sans-serif,sans-serif]"
          >
            Sign in to your business account
          </h1>
          <p className="mt-3 text-lg text-zinc-600">
            Use your work email and password, or choose another sign-in method
            below.
          </p>

          <form
            className="mt-10 space-y-6"
            onSubmit={handlePasswordSubmit}
            noValidate
          >
            <div className="space-y-2">
              <Label htmlFor={`${formId}-email`}>Email</Label>
              <Input
                id={`${formId}-email`}
                name="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError();
                  setMagicSent(false);
                }}
                className="h-11 text-base md:text-sm"
                disabled={isSubmitting}
                aria-invalid={!!formError}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${formId}-password`}>Password</Label>
              <Input
                id={`${formId}-password`}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                className="h-11 text-base md:text-sm"
                disabled={isSubmitting}
                aria-invalid={!!formError}
              />
            </div>

            {formError ? (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            ) : null}

            {magicSent ? (
              <p className="text-sm text-zinc-600" role="status" aria-live="polite">
                Check your inbox for a sign-in link. It expires in about 15
                minutes.
              </p>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="h-12 w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8 space-y-4">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "h-12 w-full gap-2 text-foreground",
                !isValidEmail(email) && "opacity-80"
              )}
              disabled={
                isSubmitting ||
                magicCooldown > 0 ||
                !isValidEmail(email) ||
                isPasskeySigningIn
              }
              onClick={() => void handlePasskeySignIn()}
            >
              {isPasskeySigningIn ? (
                <>
                  <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                  Signing in with passkey…
                </>
              ) : (
                <>
                  <Fingerprint className="size-4 shrink-0" aria-hidden />
                  Sign in with passkey
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="h-12 w-full text-foreground"
              disabled={isSubmitting || magicCooldown > 0 || !isValidEmail(email)}
              onClick={() => void handleMagicLink()}
            >
              {magicCooldown > 0
                ? `Resend link in ${magicCooldown}s`
                : "Email me a sign-in link"}
            </Button>

            {googleEnabled ? (
              <Button
                type="button"
                variant="outline"
                className="h-12 w-full text-foreground"
                onClick={handleGoogle}
                disabled={isSubmitting}
              >
                Continue with Google
              </Button>
            ) : null}
          </div>

          <p className="mt-10 text-center text-sm text-zinc-600">
            New to Morapay?{" "}
            <Link
              href="/business/signup"
              className="font-medium text-zinc-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            >
              Create a business account
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
