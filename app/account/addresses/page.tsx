import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { getAddresses } from "@/lib/catalog";
import { AddressBook } from "@/components/account-forms";

export const metadata: Metadata = { title: "Addresses", robots: { index: false, follow: false } };

export default async function AccountAddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await getAddresses(user.id);

  return (
    <div className="space-y-5">
      <div>
        <p className="eyebrow mb-1">Where the green goes</p>
        <h1 className="display-title text-[26px] font-semibold text-forest-950 sm:text-[32px]">Addresses</h1>
        <p className="mt-1.5 text-[12.5px] text-muted">Save the places you send plants to — home, work or a friend.</p>
      </div>
      <div className="card p-4 sm:p-5">
        <AddressBook addresses={addresses} />
      </div>
    </div>
  );
}
