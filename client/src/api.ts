import type { Restaurant, ChatMessage } from "./types";

export async function fetchRestaurants(city: string): Promise<Restaurant[]> {
  const res = await fetch(`/api/restaurants?city=${encodeURIComponent(city)}`);
  if (!res.ok) throw new Error("Failed to fetch restaurants");
  return res.json();
}

export function photoUrl(ref: string): string {
  return `/api/restaurants/photo?ref=${encodeURIComponent(ref)}`;
}

export async function* streamChat(
  messages: ChatMessage[],
  restaurants: Restaurant[]
): AsyncGenerator<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, restaurants }),
  });

  if (!res.ok || !res.body) throw new Error("Chat request failed");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.text) yield parsed.text;
      } catch {
        // skip malformed lines
      }
    }
  }
}
