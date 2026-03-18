"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-[var(--z-modal)] bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = React.ComponentPropsWithoutRef<
  typeof DialogPrimitive.Content
> & {
  /**
   * zoom/fade: Tailwind motion. fade avoids zoom vs centering translate fight.
   * gsap-pop: GSAP back-out scale + fade on open (inner wrapper; safe with custom positioning).
   */
  contentAnimation?: "zoom" | "fade" | "gsap-pop";
};

const MODAL_POP_DURATION = 0.48;
const MODAL_POP_EASE = "back.out(1.42)";

const DialogContent = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(({ className, children, contentAnimation = "zoom", ...props }, ref) => {
  const popWrapRef = React.useRef<HTMLDivElement>(null);
  const useGsapPop = contentAnimation === "gsap-pop";

  useGSAP(
    () => {
      if (!useGsapPop) return;
      const el = popWrapRef.current;
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
        { opacity: 0, scale: 0.92, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: MODAL_POP_DURATION,
          ease: MODAL_POP_EASE,
        }
      );
    },
    { dependencies: [useGsapPop] }
  );

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        data-modal-content
        className={cn(
          "fixed left-[50%] top-[50%] z-[var(--z-modal)] w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-border bg-card p-0 shadow-xl text-card-foreground duration-200",
          useGsapPop
            ? "grid data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-200"
            : cn(
                "grid data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                contentAnimation === "zoom" &&
                  "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
              ),
          className
        )}
        {...props}
      >
        {useGsapPop ? (
          <div
            ref={popWrapRef}
            className="flex min-h-0 w-full flex-1 flex-col gap-0 [transform-origin:center_center]"
          >
            {children}
          </div>
        ) : (
          children
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <header
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <footer
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("modal-title text-lg font-semibold leading-none tracking-tight text-card-foreground", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ComponentRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("modal-subtitle text-sm text-muted-foreground", className)}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
