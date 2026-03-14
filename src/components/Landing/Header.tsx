"use client";

import Link from "next/link";
import { useRef, useCallback, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { LaunchAppButton } from "./LaunchAppButton";

gsap.registerPlugin(ScrollTrigger);

const LOGO_IMAGE_PATH = "/images/logo.png";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Developers", href: "#developers" },
  { label: "Pricing", href: "#pricing" },
  { label: "Resources", href: "#resources" },
] as const;

const SCROLL_THRESHOLD_PX = 100;
const INACTIVITY_MS = 2500;
const EASE_HEADER = "expo.out";
const EASE_NAV = "power2.out";
const DURATION_HEADER = 0.5;
const DURATION_LOGO = 0.45;
const NAV_STAGGER = 0.04;

function resetInactivityTimer(
  timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
  callback: () => void
): void {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  timerRef.current = setTimeout(callback, INACTIVITY_MS);
}

const menuIconVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    visibility: "hidden" as const,
    pointerEvents: "none" as const,
    transition: { duration: 0.2 },
  },
  visible: {
    opacity: 1,
    scale: 1,
    visibility: "visible" as const,
    pointerEvents: "auto" as const,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.8,
    },
  },
};

const menuBarVariants: Variants = {
  top: {
    y: 0,
    rotate: 0,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  middle: {
    opacity: 1,
    scaleX: 1,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  bottom: {
    y: 0,
    rotate: 0,
    transition: { type: "spring", stiffness: 500, damping: 30 },
  },
  topActive: {
    y: 8,
    rotate: 45,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
  middleActive: {
    opacity: 0,
    scaleX: 0,
    transition: { duration: 0.15 },
  },
  bottomActive: {
    y: -8,
    rotate: -45,
    transition: { type: "spring", stiffness: 400, damping: 25 },
  },
};

export function Header() {
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navLinksRef = useRef<HTMLAnchorElement[]>([]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCompact, setIsCompact] = useState(false);
  const setCompactRef = useRef(setIsCompact);
  setCompactRef.current = setIsCompact;

  const expandToWide = useCallback(() => {
    const header = headerRef.current;
    const logo = logoRef.current;
    const nav = navRef.current;
    const links = navLinksRef.current;

    if (!header || !logo || !nav) return;

    gsap.to(header, {
      height: 72,
      backgroundColor: "rgba(255, 255, 255, 0)",
      backdropFilter: "blur(0px)",
      duration: DURATION_HEADER,
      ease: EASE_HEADER,
      overwrite: true,
    });

    gsap.to(logo, {
      scale: 1,
      x: 0,
      duration: DURATION_LOGO,
      ease: EASE_HEADER,
      overwrite: true,
    });

    gsap.to(nav, { opacity: 1, duration: 0.2, delay: 0.15 });
    gsap.set(nav, { pointerEvents: "auto", visibility: "visible" });

    links.forEach((link, i) => {
      gsap.fromTo(
        link,
        { opacity: 0, y: -4 },
        {
          opacity: 1,
          y: 0,
          duration: 0.35,
          delay: 0.1 + i * NAV_STAGGER,
          ease: EASE_NAV,
          overwrite: true,
        }
      );
    });
    setCompactRef.current?.(false);
  }, []);

  const collapseToCompact = useCallback(() => {
    const header = headerRef.current;
    const logo = logoRef.current;
    const nav = navRef.current;
    const links = navLinksRef.current;

    if (!header || !logo || !nav) return;

    const staggerDelay = links.length * NAV_STAGGER + 0.05;

    links.forEach((link, i) => {
      gsap.to(link, {
        opacity: 0,
        y: -6,
        duration: 0.25,
        delay: i * NAV_STAGGER,
        ease: EASE_NAV,
        overwrite: true,
      });
    });

    gsap.to(nav, {
      opacity: 0,
      duration: 0.2,
      delay: staggerDelay,
      onComplete: () => {
        gsap.set(nav, { pointerEvents: "none", visibility: "hidden" });
      },
    });

    gsap.to(header, {
      height: 72,
      width: "60%",
      backgroundColor: "rgba(255, 255, 255, 0)",
      backdropFilter: "blur(0px)",
      duration: DURATION_HEADER,
      delay: staggerDelay * 0.5,
      ease: EASE_HEADER,
      overwrite: true,
    });

    gsap.to(logo, {
      scale: 0.75,
      x: 0,
      duration: DURATION_LOGO,
      delay: staggerDelay * 0.4,
      ease: EASE_HEADER,
      overwrite: true,
    });
    setCompactRef.current?.(true);
  }, []);

  useGSAP(
    () => {
      const header = headerRef.current;
      const logo = logoRef.current;
      const nav = navRef.current;
      if (!header || !logo || !nav) return;

      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self: { scroll: () => number; direction: number }) => {
          const y = self.scroll();
          const isPastThreshold = y > SCROLL_THRESHOLD_PX;

          if (self.direction !== 0) {
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
              inactivityTimerRef.current = null;
            }
            if (isPastThreshold) {
              collapseToCompact();
              resetInactivityTimer(inactivityTimerRef, () => {
                if (typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD_PX) {
                  expandToWide();
                }
              });
            } else {
              expandToWide();
            }
            return;
          }
        },
      });

      if (typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD_PX) {
        setCompactRef.current?.(true);
      }

      return () => {
        trigger.kill();
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    },
    { scope: headerRef, dependencies: [expandToWide, collapseToCompact] }
  );

  const initialCheck = useCallback(() => {
    if (typeof window === "undefined") return;
    const y = window.scrollY;
    if (y > SCROLL_THRESHOLD_PX) {
      const header = headerRef.current;
      const logo = logoRef.current;
      const nav = navRef.current;
      if (header) {
        gsap.set(header, {
          height: 56,
          backgroundColor: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(12px)",
        });
      }
      if (logo) gsap.set(logo, { scale: 0.75, x: -8 });
      if (nav) gsap.set(nav, { opacity: 0, pointerEvents: "none", visibility: "hidden" });
      setCompactRef.current?.(true);
    }
  }, []);

  useGSAP(
    () => {
      initialCheck();
    },
    { scope: headerRef, dependencies: [initialCheck] }
  );

  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="mx-auto flex justify-center fixed w-full">

    <header
      ref={headerRef}
      className="sticky top-20 z-50 w-full overflow-hidden rounded-b-2xl 0 transition-[backdrop-filter] self-center"
      style={{ height: 72 }}
      role="banner"
      aria-label="Site header"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6 px-6 md:px-8">
        <Link
          ref={logoRef}
          href="/"
          className="flex shrink-0 origin-left items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Klyra home"
        >
          <img
            src={LOGO_IMAGE_PATH}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11"
          />
          <span className="text-xl font-semibold text-foreground md:text-2xl">Klyra</span>
        </Link>

        <nav
          ref={navRef}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-8"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map(({ label, href }, i) => (
            <Link
              key={label}
              ref={(el) => {
                if (el) navLinksRef.current[i] = el;
              }}
              href={href}
              className="text-sm font-medium text-foreground hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="relative flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="#"
              className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Sign in
            </Link>
            <LaunchAppButton>Sign up</LaunchAppButton>
          </div>

          <motion.button
            type="button"
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              !isCompact && "absolute right-0 size-0 overflow-hidden"
            )}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            variants={menuIconVariants}
            initial="hidden"
            animate={isCompact ? "visible" : "hidden"}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="size-6 origin-center"
              aria-hidden
            >
              <motion.path
                d="M4 6h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="origin-center"
                style={{ transformOrigin: "12px 6px" }}
                variants={menuBarVariants}
                initial="top"
                animate={menuOpen ? "topActive" : "top"}
              />
              <motion.path
                d="M4 12h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="origin-center"
                style={{ transformOrigin: "12px 12px" }}
                variants={menuBarVariants}
                initial="middle"
                animate={menuOpen ? "middleActive" : "middle"}
              />
              <motion.path
                d="M4 18h16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                className="origin-center"
                style={{ transformOrigin: "12px 18px" }}
                variants={menuBarVariants}
                initial="bottom"
                animate={menuOpen ? "bottomActive" : "bottom"}
              />
            </svg>
          </motion.button>
        </div>
      </div>
    </header>
    </div>
  );
}
