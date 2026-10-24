import { NextResponse } from "next/server";
import { getDeliveryZone } from "@/lib/catalog";
import { isValidPincode } from "@/lib/pricing";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pincode = (searchParams.get("pincode") ?? "").replace(/\D/g, "").slice(0, 6);
  if (!isValidPincode(pincode)) {
    return NextResponse.json({ serviceable: false, message: "Enter a valid 6-digit pincode." }, { status: 400 });
  }
  const limit = rateLimit(clientKey(request.headers, "pincode"), 40, 60_000);
  if (!limit.allowed) {
    return NextResponse.json({ serviceable: false, message: "Too many checks. Please wait a moment." }, { status: 429 });
  }
  const zone = await getDeliveryZone(pincode);
  return NextResponse.json({
    serviceable: true,
    pincode,
    charge: zone.charge,
    estimatedDays: zone.estimated_days,
    message: `Delivers in about ${zone.estimated_days} days`,
  });
}
