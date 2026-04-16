import { Suspense } from "react";
import { PayContainer } from "@/components/Pay/PayContainer";

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-sm text-muted-foreground" aria-busy="true">
          Loading…
        </div>
      }
    >
      <PayContainer />
    </Suspense>
  );
}
