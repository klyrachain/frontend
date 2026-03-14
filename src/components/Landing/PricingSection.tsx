"use client";

import { useState } from "react";
import { LaunchAppButton } from "./LaunchAppButton";
import { cn } from "@/lib/utils";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  name: string;
  priceMonthly: string;
  priceYearly: string;
  ctaLabel: string;
  description?: string;
  features: { included: boolean; label: string }[];
  highlighted?: boolean;
}

const PLANS: Plan[] = [
  {
    name: "Free",
    priceMonthly: "$0",
    priceYearly: "$0",
    ctaLabel: "Start Free",
    features: [
      { included: true, label: "Up to 100 transactions" },
      { included: true, label: "Basic support" },
      { included: false, label: "Advanced analytics" },
      { included: false, label: "Priority support" },
    ],
  },
  {
    name: "Starter",
    priceMonthly: "$9.99",
    priceYearly: "$99",
    ctaLabel: "Get Started",
    features: [
      { included: true, label: "Up to 1,000 transactions" },
      { included: true, label: "Email support" },
      { included: true, label: "Basic analytics" },
      { included: false, label: "Priority support" },
    ],
  },
  {
    name: "Pro",
    priceMonthly: "$24.99",
    priceYearly: "$249",
    ctaLabel: "Get Started",
    description: "Most popular",
    features: [
      { included: true, label: "Unlimited transactions" },
      { included: true, label: "Priority support" },
      { included: true, label: "Advanced analytics" },
      { included: true, label: "Custom workflows" },
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    priceMonthly: "$99.99",
    priceYearly: "$999",
    ctaLabel: "Get Started",
    features: [
      { included: true, label: "Everything in Pro" },
      { included: true, label: "Dedicated success manager" },
      { included: true, label: "SLA & compliance" },
      { included: true, label: "Custom integrations" },
    ],
  },
];

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  return (
    <section
      id="pricing"
      className="mx-auto max-w-7xl px-[var(--g2)] py-[var(--g8)] md:px-[var(--g4)] md:py-[var(--g10)]"
      aria-labelledby="pricing-heading"
    >
      <h2
        id="pricing-heading"
        className="text-center text-2xl font-bold text-foreground md:text-3xl lg:text-4xl"
        style={{ marginBottom: "var(--g2)" }}
      >
        A Pricing plan that works for all!
      </h2>
      <p
        className="mx-auto max-w-2xl text-center text-muted-foreground"
        style={{ marginBottom: "var(--g4)", lineHeight: 1.6 }}
      >
        Simple, transparent, and built to scale with you.
      </p>

      <div
        className="mb-[var(--g6)] flex justify-center"
        role="group"
        aria-label="Billing cycle"
      >
        <div className="inline-flex rounded-lg border border-border p-1">
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            className={cn(
              "h-10 rounded-md px-[var(--g4)] py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              billingCycle === "monthly"
                ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={billingCycle === "monthly"}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            className={cn(
              "h-10 rounded-md px-[var(--g4)] py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              billingCycle === "yearly"
                ? "bg-[#1A1A1A] text-white dark:bg-white dark:text-[#1A1A1A]"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={billingCycle === "yearly"}
          >
            Yearly
          </button>
        </div>
      </div>

      <div className="grid gap-[var(--g4)] sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={cn(
              "flex flex-col rounded-xl border p-[var(--g4)] md:p-[var(--g5)]",
              plan.highlighted
                ? "border-foreground/20 bg-[#1A1A1A] text-white dark:bg-foreground dark:text-background"
                : "border-border bg-card"
            )}
          >
            <h3 className="text-lg font-semibold" style={{ marginBottom: "var(--g1)" }}>
              {plan.name}
            </h3>
            {plan.description && (
              <p
                className="text-sm opacity-90"
                style={{ marginBottom: "var(--g2)" }}
              >
                {plan.description}
              </p>
            )}
            <p className="text-2xl font-bold" style={{ marginBottom: "var(--g3)" }}>
              {billingCycle === "monthly" ? plan.priceMonthly : plan.priceYearly}
              <span className="text-sm font-normal opacity-80">
                /{billingCycle === "monthly" ? "mo" : "yr"}
              </span>
            </p>
            <ul className="flex flex-col gap-[var(--g1)] flex-1 text-sm" style={{ marginBottom: "var(--g4)", paddingLeft: 0, listStyle: "none" }}>
              {plan.features.map(({ included, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span aria-hidden={true}>
                    {included ? "✓" : "✗"}
                  </span>
                  <span className={included ? undefined : "opacity-60"}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>
            {plan.highlighted ? (
              <LaunchAppButton href="#" variant="outline">
                {plan.ctaLabel}
              </LaunchAppButton>
            ) : (
              <LaunchAppButton href="#" className="w-full justify-center">
                {plan.ctaLabel}
              </LaunchAppButton>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
