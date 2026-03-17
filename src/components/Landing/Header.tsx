"use client";

import Link from "next/link";
import { useRef, useCallback, useState, useEffect } from "react";
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

const COLORS = {
  bg: "rgba(10, 10, 10, 0.92)",
  transparent: "rgba(10, 10, 10, 0)",
} as const;

const SCROLL_THRESHOLD_PX = 80;
const INACTIVITY_MS = 2500;
const EASE_MAIN = "expo.inOut";
const DURATION_SMOOTH = 0.6;
const NAV_STAGGER = 0.05;
const DESKTOP_BREAKPOINT_PX = 768;

const COMPACT_HEIGHT = 52;
const WIDE_HEIGHT = 72;
const COMPACT_TOP = 16;
const WIDE_TOP = 24;

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

export interface HeaderProps {
  /** When true, header mounts in dynamic-island (compact) size instead of wide. */
  initialCompact?: boolean;
}

export function Header({ initialCompact = false }: HeaderProps) {
  const headerRef = useRef<HTMLElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const navLinksRef = useRef<HTMLAnchorElement[]>([]);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCompact, setIsCompact] = useState(initialCompact);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = () => setIsDesktop(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const expandToWide = useCallback(() => {
    if (!headerRef.current || !logoRef.current || !navRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: EASE_MAIN, overwrite: "auto" },
    });

    tl.to(headerRef.current, {
      height: WIDE_HEIGHT,
      width: "100%",
      maxWidth: "100%",
      backgroundColor: COLORS.transparent,
      backdropFilter: "blur(10px)",
      boxShadow: "none",
      borderRadius: "0px",
      duration: DURATION_SMOOTH,
    })
      .to(
        wrapperRef.current,
        { top: WIDE_TOP, duration: DURATION_SMOOTH },
        0
      )
      .to(logoRef.current, { scale: 1, duration: DURATION_SMOOTH }, 0)
      .to(
        navRef.current,
        {
          opacity: 1,
          visibility: "visible",
          pointerEvents: "auto",
          duration: 0.4,
        },
        0.1
      );

    navLinksRef.current.forEach((link, i) => {
      gsap.to(link, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.1 + i * NAV_STAGGER,
        ease: "power2.out",
        overwrite: "auto",
      });
    });

    setIsCompact(false);
  }, []);

  const collapseToCompact = useCallback(() => {
    if (!headerRef.current || !logoRef.current || !navRef.current) return;

    const tl = gsap.timeline({
      defaults: { ease: EASE_MAIN, overwrite: "auto" },
    });

    tl.to(headerRef.current, {
      height: isDesktop ? WIDE_HEIGHT : COMPACT_HEIGHT,
      width: isDesktop ? "90%" : "auto",
      maxWidth: isDesktop ? "960px" : "320px",
      backgroundColor: COLORS.bg,
      borderRadius: isDesktop ? "1rem" : "999px",
      backdropFilter: "blur(16px)",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      duration: DURATION_SMOOTH,
    })
      .to(
        wrapperRef.current,
        { top: COMPACT_TOP, duration: DURATION_SMOOTH },
        0
      )
      .to(logoRef.current, { scale: 0.85, duration: DURATION_SMOOTH }, 0);

    if (!isDesktop) {
      gsap.to(navLinksRef.current, {
        opacity: 0,
        y: -5,
        duration: 0.3,
        stagger: 0.02,
      });
      gsap.to(navRef.current, {
        opacity: 0,
        visibility: "hidden",
        duration: 0.3,
        onComplete: () => {
          if (navRef.current) {
            gsap.set(navRef.current, {
              pointerEvents: "none",
              visibility: "hidden",
            });
          }
        },
      });
    }

    setIsCompact(true);
  }, [isDesktop]);

  useGSAP(
    () => {
      if (typeof window !== "undefined" && window.scrollY > SCROLL_THRESHOLD_PX) {
        collapseToCompact();
      }

      const trigger = ScrollTrigger.create({
        start: `${SCROLL_THRESHOLD_PX}px top`,
        onEnter: () => collapseToCompact(),
        onLeaveBack: () => expandToWide(),
        onUpdate: (self) => {
          if (self.scroll() > SCROLL_THRESHOLD_PX) {
            if (inactivityTimerRef.current) {
              clearTimeout(inactivityTimerRef.current);
            }
            inactivityTimerRef.current = setTimeout(() => {
              expandToWide();
            }, INACTIVITY_MS);
          } else if (inactivityTimerRef.current) {
            clearTimeout(inactivityTimerRef.current);
            inactivityTimerRef.current = null;
          }
        },
      });

      return () => {
        trigger.kill();
        if (inactivityTimerRef.current) {
          clearTimeout(inactivityTimerRef.current);
        }
      };
    },
    {
      scope: headerRef,
      dependencies: [isDesktop, collapseToCompact, expandToWide],
    }
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const showMenuIcon = isCompact && !isDesktop;

  const wrapperTop = isCompact ? COMPACT_TOP : WIDE_TOP;
  const headerCompactStyle = isCompact
    ? {
        height: isDesktop ? WIDE_HEIGHT : COMPACT_HEIGHT,
        width: isDesktop ? "90%" : "auto",
        maxWidth: isDesktop ? "960px" : "320px",
        backgroundColor: COLORS.bg,
        borderRadius: isDesktop ? "1rem" : "999px",
        backdropFilter: "blur(16px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }
    : undefined;
  const headerWideStyle = {
    height: WIDE_HEIGHT,
    width: "100%",
    maxWidth: "100%",
    backgroundColor: COLORS.transparent,
    backdropFilter: "blur(10px)",
    boxShadow: "none",
    borderRadius: "0px",
  };
  const headerStyle = headerCompactStyle ?? headerWideStyle;
  const navCompactStyle =
    isCompact && !isDesktop
      ? { opacity: 0, visibility: "hidden" as const, pointerEvents: "none" as const }
      : undefined;
  const logoCompactStyle = isCompact ? { transform: "scale(0.85)" } : undefined;

  return (
    <div
      ref={wrapperRef}
      className="fixed left-0 right-0 z-[100] flex justify-center px-4 transition-[top] duration-500"
      style={{ top: wrapperTop }}
    >
      <header
        ref={headerRef}
        className="w-full overflow-hidden rounded-2xl transition-[backdrop-filter] self-center md:rounded-b-2xl px-4"
        style={headerStyle}
        role="banner"
        aria-label="Site header"
      >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-6">
        <Link
          ref={logoRef}
          href="/"
          className="flex shrink-0 origin-left items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={logoCompactStyle}
          aria-label="morapay home"
        >
          <img
            src={LOGO_IMAGE_PATH}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 object-contain md:h-11 md:w-11"
          />
          <span className="font-shinier text-xl font-semibold text-foreground md:text-2xl">morapay</span>
        </Link>

        <nav
          ref={navRef}
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-8"
          style={navCompactStyle}
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
              "flex size-10 shrink-0 items-center justify-center rounded-lg text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden",
              !showMenuIcon && "absolute right-0 size-0 overflow-hidden"
            )}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            variants={menuIconVariants}
            initial="hidden"
            animate={showMenuIcon ? "visible" : "hidden"}
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
