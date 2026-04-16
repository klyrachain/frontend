export function getDynamicEnvironmentId(): string | undefined {
  return process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim() || undefined;
}

export function getZeroDevProjectId(): string | undefined {
  return process.env.NEXT_PUBLIC_ZERODEV_PROJECT_ID?.trim() || undefined;
}
