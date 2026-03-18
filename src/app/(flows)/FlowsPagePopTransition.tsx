"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const POP_DURATION = 0.52;
const POP_EASE = "back.out(1.35)";

export function FlowsPagePopTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = containerRef.current;
      if (!el) return;
      gsap.killTweensOf(el);
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        gsap.set(el, { opacity: 1, scale: 1, y: 0 });
        return;
      }
      gsap.fromTo(
        el,
        { opacity: 0, scale: 0.94, y: 18 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: POP_DURATION,
          ease: POP_EASE,
        }
      );
    },
    { dependencies: [pathname], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="flex w-full min-w-0 flex-col items-center [transform-origin:center_top]"
    >
      {children}
    </div>
  );
}
