import { redirect } from "next/navigation";

type Search = Record<string, string | string[] | undefined>;

export default async function LegacyCheckoutReturnRedirect(props: {
  searchParams: Promise<Search>;
}) {
  const sp = await props.searchParams;
  const q = new URLSearchParams();
  for (const [key, val] of Object.entries(sp)) {
    if (val === undefined) continue;
    if (Array.isArray(val)) {
      val.forEach((v) => q.append(key, v));
    } else {
      q.set(key, val);
    }
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/checkout/payment/return${suffix}`);
}
