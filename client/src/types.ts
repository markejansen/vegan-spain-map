export interface Restaurant {
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

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
