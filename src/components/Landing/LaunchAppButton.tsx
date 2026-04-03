import Link from "next/link";
import { cn } from "@/lib/utils";
import { toAppUrl } from "@/lib/site-hosts";

const LAUNCH_APP_HREF = "/app";

interface LaunchAppButtonProps {
  children?: React.ReactNode;
  href?: string;
  className?: string;
  variant?: "primary" | "outline";
}

export function LaunchAppButton({
  children = "Launch App",
  href = LAUNCH_APP_HREF,
  className,
  variant = "primary",
}: LaunchAppButtonProps) {
  const targetHref =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("#")
      ? href
      : toAppUrl(href);

  const baseClass =
    "inline-flex items-center justify-center h-10 min-h-10 rounded-lg px-6 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
  const primaryClass =
    "bg-[#e7cee3] text-black hover:bg-white dark:bg-white dark:text-[#1A1A1A] dark:hover:bg-neutral-100";
  const outlineClass =
    "border-2 border-white bg-transparent text-white hover:bg-white/10";

  return (
    <Link
      href={targetHref}
      className={cn(
        baseClass,
        variant === "primary" ? primaryClass : outlineClass,
        className
      )}
      aria-label="Launch the application"
    >
      {children}
    </Link>
  );
}
