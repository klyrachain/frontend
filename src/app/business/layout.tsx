import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay a business | Morapay",
  description: "Complete your payment to a business.",
};

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh bg-white text-zinc-900 antialiased">
      {children}
    </div>
  );
}
