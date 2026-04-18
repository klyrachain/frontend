import { Suspense } from "react";
import { CheckoutCodeClient } from "../../[code]/checkout-code-client";

export default function CheckoutBusinessGasPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-sm text-muted-foreground" aria-busy="true">
          Loading checkout…
        </div>
      }
    >
      <CheckoutCodeClient linkFetchVariant="gas" />
    </Suspense>
  );
}
