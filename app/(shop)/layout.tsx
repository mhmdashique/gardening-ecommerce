import { getCurrentUser } from "@/lib/auth";
import { getCategories, getSettings, getWishlistProducts } from "@/lib/catalog";
import { CartProvider } from "@/components/cart-provider";
import { MobileCartBar } from "@/components/cart-ui";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { HelpChat } from "@/components/help-chat";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const wishlistCount = user ? (await getWishlistProducts(user.id)).length : 0;

  return (
    <CartProvider settings={settings} loggedIn={Boolean(user)}>
      <SiteHeader
        user={user}
        categories={categories}
        wishlistCount={wishlistCount}
        freeShippingThreshold={settings.free_shipping_threshold}
      />
      <main id="main-content" className="min-h-[50vh]">
        {children}
      </main>
      <SiteFooter />
      <MobileCartBar />
      <HelpChat firstName={user?.full_name?.split(" ")[0]} />
    </CartProvider>
  );
}
