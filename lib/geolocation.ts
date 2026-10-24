"use client";

export interface DetectedLocation {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formatted?: string;
}

/**
 * Uses browser navigator.geolocation and reverse geocoding
 * to autofill street address, city, state, and pincode.
 */
export async function detectCurrentLocation(): Promise<DetectedLocation> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser.");
  }

  const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      resolve,
      (err) => {
        let message = "Could not get your location.";
        if (err.code === 1) {
          message = "Location access was denied. Please allow location permissions in your browser.";
        } else if (err.code === 2) {
          message = "Location position unavailable. Please check your GPS/network.";
        } else if (err.code === 3) {
          message = "Location request timed out. Please try again.";
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });

  const { latitude, longitude } = pos.coords;

  // 1. Try Nominatim (OpenStreetMap) with English priority
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      {
        headers: {
          "Accept-Language": "en",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      const streetParts = [
        addr.house_number,
        addr.building,
        addr.road || addr.pedestrian || addr.footway || addr.suburb,
      ].filter(Boolean);

      const areaParts = [
        addr.neighbourhood || addr.residential || addr.quarter || addr.suburb,
        addr.city_district || addr.subdistrict,
      ].filter(Boolean);

      const city =
        addr.city ||
        addr.town ||
        addr.municipality ||
        addr.village ||
        addr.county ||
        "";
      const state = addr.state || addr.state_district || "";
      const pincode = addr.postcode
        ? addr.postcode.replace(/\D/g, "").slice(0, 6)
        : "";

      const line1 = streetParts.length > 0 ? streetParts.join(", ") : (data.name !== city ? data.name : "");
      const line2 = areaParts.length > 0 && areaParts[0] !== line1 ? areaParts[0] : "";

      return {
        line1: line1 || (data.name !== city ? data.name : "") || "Current Location",
        line2,
        city,
        state,
        pincode,
        formatted: data.display_name,
      };
    }
  } catch (err) {
    console.warn("Nominatim reverse geocode lookup failed, falling back:", err);
  }

  // 2. Fallback to BigDataCloud reverse geocode client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    );
    if (res.ok) {
      const data = await res.json();
      const city = data.city || data.locality || "";
      const state = data.principalSubdivision || "";
      const pincode = data.postcode
        ? data.postcode.replace(/\D/g, "").slice(0, 6)
        : "";
      const line1 = data.locality || "";

      return {
        line1,
        line2: "",
        city,
        state,
        pincode,
      };
    }
  } catch (err) {
    console.warn("BigDataCloud reverse geocode lookup failed:", err);
  }

  throw new Error("Unable to determine address from GPS coordinates. Please enter manually.");
}
