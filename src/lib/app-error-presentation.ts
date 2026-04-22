import errorRiveConfig from "@/data/error-rive-messages.json";

export type ErrorRiveEntry = {
  rive: string;
  title: string;
  message: string;
};

type ConfigShape = {
  defaultKey: string;
  entries: Record<string, ErrorRiveEntry>;
};

const config = errorRiveConfig as ConfigShape;

export type ErrorPresentation = ErrorRiveEntry & { key: string };

function classifyRawToKey(raw: string): string {
  const lower = raw.toLowerCase();

  if (
    lower.includes("invalid claim link") ||
    (lower.includes("invalid") && lower.includes("link"))
  ) {
    return "invalid_link";
  }
  if (
    lower.includes("not found") ||
    lower.includes("404") ||
    lower.includes("claim not found")
  ) {
    return "not_found";
  }
  if (
    lower.includes("timeout") ||
    lower.includes("network error") ||
    lower.includes("econn") ||
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch")
  ) {
    return "network";
  }
  if (
    lower.includes("500") ||
    lower.includes("server") ||
    lower.includes("internal")
  ) {
    return "server";
  }
  if (
    lower.includes("otp") ||
    lower.includes("claim code") ||
    lower.includes("recipient") ||
    lower.includes("verify") ||
    lower.includes("does not match") ||
    lower.includes("incorrect") ||
    lower.includes("verification failed")
  ) {
    return "verification";
  }
  if (
    lower.includes("quote") ||
    lower.includes("settlement") ||
    lower.includes("slippage") ||
    lower.includes("revert")
  ) {
    return "quote";
  }
  if (lower.includes("reject") || lower.includes("denied") || lower.includes("user denied")) {
    return "wallet";
  }

  return config.defaultKey;
}

export function presentationFromRaw(raw: string | null | undefined): ErrorPresentation | null {
  if (raw == null || !String(raw).trim()) return null;
  const key = classifyRawToKey(String(raw));
  const entry = config.entries[key] ?? config.entries[config.defaultKey];
  if (!entry) {
    return {
      key: config.defaultKey,
      rive: "/rive/22487-42095-look.riv",
      title: "Something paused",
      message:
        "We hit a small snag. Give it another try in a moment.",
    };
  }
  return { key, ...entry };
}
