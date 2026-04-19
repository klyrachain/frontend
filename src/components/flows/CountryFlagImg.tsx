"use client";

import Image from "next/image";
import { countryFlagImgSrc } from "@/lib/country-flag-url";
import { cn } from "@/lib/utils";

export type CountryFlagImgProps = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  className?: string;
  title?: string;
};

export function CountryFlagImg({ code, className, title }: CountryFlagImgProps) {
  const src = countryFlagImgSrc(code);
  if (!src) return null;
  return (
    <Image
      src={src}
      alt=""
      width={28}
      height={20}
      unoptimized
      title={title}
      className={cn(
        "inline-block h-5 w-7 shrink-0 rounded-sm border border-border/60 object-cover shadow-sm",
        className
      )}
    />
  );
}
