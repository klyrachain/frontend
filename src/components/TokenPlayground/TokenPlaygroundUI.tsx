"use client";

import { motion } from "framer-motion";
import { TOKEN_CONFIGS } from "@/config/tokenPlayground";
import { Button } from "@/components/ui/button";

interface TokenPlaygroundUIProps {
  onMint: (configId: string) => void;
}

export function TokenPlaygroundUI({ onMint }: TokenPlaygroundUIProps) {
  return (
    <motion.header
      className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-xl font-semibold text-foreground/90">
        Token Playground
      </h1>
      <nav className="flex items-center gap-2" aria-label="Mint tokens">
        {TOKEN_CONFIGS.map((config) => (
          <Button
            key={config.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onMint(config.id)}
            className="rounded-xl border-white/20 bg-white/5 px-3 py-2 text-sm font-medium hover:bg-white/10"
          >
            Mint {config.symbol}
          </Button>
        ))}
      </nav>
    </motion.header>
  );
}
