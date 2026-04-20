"use client";

import { Suspense, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const POP_DURATION = 0.52;
const POP_EASE = "back.out(1.35)";

const transitionShellClassName =
  "flex w-full min-w-0 flex-col items-center [transform-origin:center_top]";

function FlowsPagePopTransitionInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  /** Re-run pop when switching App / Pay / Receive or when query changes on the same path. */
  const transitionKey = `${pathname}?${searchParams.toString()}`;
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
    { dependencies: [transitionKey], scope: containerRef }
  );

  return (
    <div ref={containerRef} className={transitionShellClassName}>
      {children}
    </div>
  );
}

export function FlowsPagePopTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<div className={transitionShellClassName}>{children}</div>}
    >
      <FlowsPagePopTransitionInner>{children}</FlowsPagePopTransitionInner>
    </Suspense>
  );
}
