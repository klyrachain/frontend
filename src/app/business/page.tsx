import { BusinessPayView } from "@/components/Business/BusinessPayView";
import { parseBusinessPaySearchParams } from "@/lib/businessPayParams";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function BusinessPayPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const { amountDisplay, currencyDisplay, businessName, businessLogoUrl } =
    parseBusinessPaySearchParams(sp);

  return (
    <BusinessPayView
      amountDisplay={amountDisplay}
      currencyDisplay={currencyDisplay}
      businessName={businessName}
      businessLogoUrl={businessLogoUrl}
    />
  );
}
