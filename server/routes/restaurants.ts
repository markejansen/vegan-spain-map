import { Router, Request, Response } from "express";

const router = Router();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const PLACES_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json";

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: { photo_reference: string }[];
  opening_hours?: { open_now: boolean };
  types: string[];
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  priceLevel: number | null;
  photoRef: string | null;
  openNow: boolean | null;
  isFullyVegan: boolean;
  mapsUrl: string;
}

async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const url = new URL(PLACES_URL);
  url.searchParams.set("query", query);
  url.searchParams.set("type", "restaurant");
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("language", "en");

  const res = await fetch(url.toString());
  const data = await res.json() as { results: PlaceResult[]; status: string };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status}`);
  }
  return data.results || [];
}

function toRestaurant(place: PlaceResult, isFullyVegan: boolean): Restaurant {
  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating ?? 0,
    reviewCount: place.user_ratings_total ?? 0,
    priceLevel: place.price_level ?? null,
    photoRef: place.photos?.[0]?.photo_reference ?? null,
    openNow: place.opening_hours?.open_now ?? null,
    isFullyVegan,
    mapsUrl: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
  };
}

router.get("/", async (req: Request, res: Response) => {
  const city = (req.query.city as string) || "Spain";

  if (!GOOGLE_API_KEY) {
    res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
    return;
  }

  try {
    const [veganPlaces, veganOptionPlaces] = await Promise.all([
      searchPlaces(`vegan restaurant in ${city} Spain`),
      searchPlaces(`vegan options restaurant in ${city} Spain`),
    ]);

    // Deduplicate by place_id; fully vegan takes priority
    const map = new Map<string, Restaurant>();

    for (const place of veganOptionPlaces) {
      map.set(place.place_id, toRestaurant(place, false));
    }
    for (const place of veganPlaces) {
      map.set(place.place_id, toRestaurant(place, true));
    }

    const restaurants = Array.from(map.values()).sort(
      (a, b) => b.rating - a.rating
    );

    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch restaurants" });
  }
});

// Nearby search by coordinates
async function searchNearby(lat: number, lng: number, radius: number, keyword: string): Promise<PlaceResult[]> {
  const url = new URL(NEARBY_URL);
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("type", "restaurant");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("key", GOOGLE_API_KEY);
  url.searchParams.set("language", "en");

  const res = await fetch(url.toString());
  const data = await res.json() as { results: PlaceResult[]; status: string };

  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(`Places API error: ${data.status}`);
  }
  return data.results || [];
}

router.get("/nearby", async (req: Request, res: Response) => {
  const { lat, lng, radius = "3000" } = req.query as { lat: string; lng: string; radius?: string };

  if (!lat || !lng) {
    res.status(400).json({ error: "lat and lng required" });
    return;
  }

  if (!GOOGLE_API_KEY) {
    res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
    return;
  }

  try {
    const [veganPlaces, veganOptionPlaces] = await Promise.all([
      searchNearby(parseFloat(lat), parseFloat(lng), parseInt(radius), "vegan"),
      searchNearby(parseFloat(lat), parseFloat(lng), parseInt(radius), "vegan options"),
    ]);

    const map = new Map<string, Restaurant>();
    for (const place of veganOptionPlaces) map.set(place.place_id, toRestaurant(place, false));
    for (const place of veganPlaces) map.set(place.place_id, toRestaurant(place, true));

    res.json(Array.from(map.values()).sort((a, b) => b.rating - a.rating));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch nearby restaurants" });
  }
});

// Photo proxy (avoids exposing API key in client)
router.get("/photo", async (req: Request, res: Response) => {
  const { ref } = req.query as { ref: string };
  if (!ref) {
    res.status(400).send("Missing ref");
    return;
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/photo");
  url.searchParams.set("photoreference", ref);
  url.searchParams.set("maxwidth", "600");
  url.searchParams.set("key", GOOGLE_API_KEY);

  const photoRes = await fetch(url.toString());
  res.setHeader("Content-Type", photoRes.headers.get("content-type") || "image/jpeg");
  const buffer = await photoRes.arrayBuffer();
  res.send(Buffer.from(buffer));
});

export default router;
