import { Suspense } from "react";
import { ClaimLinkClient } from "./claim-link-client";

export default function ClaimByLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-sm text-muted-foreground" aria-busy="true">
          Loading claim…
        </div>
      }
    >
      <ClaimLinkClient />
    </Suspense>
  );
}
