"use client";

import type { ComponentProps, ReactNode } from "react";
import { DynamicConnectButton } from "@dynamic-labs/sdk-react-core";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDynamicEnvironmentId } from "@/lib/dynamic/dynamic-app-config";

type DynamicConnectTriggerProps = Omit<ComponentProps<typeof Button>, "children"> & {
  label?: string;
  children?: ReactNode;
};

/**
 * Wallet connect CTA: pass `label` or `children` for copy. Uses Dynamic when env is configured.
 */
export function DynamicConnectTrigger({
  label,
  children,
  className,
  variant = "default",
  size = "default",
  ...buttonProps
}: DynamicConnectTriggerProps) {
  const envId = getDynamicEnvironmentId();
  const content = children ?? label ?? "Connect wallet";

  if (!envId) {
    return (
      <Button type="button" variant={variant} size={size} className={className} disabled {...buttonProps}>
        {content}
      </Button>
    );
  }

  return (
    <DynamicConnectButton buttonClassName={cn(buttonVariants({ variant, size, className }))}>
      {content}
    </DynamicConnectButton>
  );
}
