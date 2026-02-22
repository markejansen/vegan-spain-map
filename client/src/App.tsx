import { useState, useEffect, useCallback } from "react";
import Map from "./components/Map";
import Sidebar from "./components/Sidebar";
import ChatPanel from "./components/ChatPanel";
import { fetchRestaurants } from "./api";
import type { Restaurant } from "./types";

// ⚠️  The Maps JS API key is safe to expose in client-side code
// (it should be restricted to your domain in Google Cloud Console)
const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";

const CITIES = [
  "Spain",
  "Madrid",
  "Barcelona",
  "Valencia",
  "Seville",
  "Bilbao",
  "Málaga",
  "Granada",
  "Palma",
];

export default function App() {
  const [city, setCity] = useState("Spain");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (c: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(null);
    try {
      const data = await fetchRestaurants(c);
      setRestaurants(data);
    } catch (e) {
      setError("Could not load restaurants. Check that the server is running and API keys are set.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(city);
  }, [city, load]);

  if (!GOOGLE_MAPS_KEY) {
    return (
      <div style={styles.errorPage}>
        <h2>⚠️ Missing Google Maps API Key</h2>
        <p style={{ marginTop: 12, color: "#6b7280" }}>
          Add <code>VITE_GOOGLE_MAPS_KEY=your_key</code> to <code>client/.env</code> and restart Vite.
        </p>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <Sidebar
        restaurants={restaurants}
        selectedId={selectedId}
        onSelect={setSelectedId}
        loading={loading}
      />

      <div style={styles.mapArea}>
        {/* City selector */}
        <div style={styles.cityBar}>
          {CITIES.map((c) => (
            <button
              key={c}
              onClick={() => setCity(c)}
              style={{
                ...styles.cityBtn,
                ...(city === c ? styles.cityBtnActive : {}),
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <Map
          restaurants={restaurants}
          selectedId={selectedId}
          onSelect={setSelectedId}
          googleMapsKey={GOOGLE_MAPS_KEY}
        />
      </div>

      <ChatPanel restaurants={restaurants} />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "relative",
  },
  mapArea: {
    flex: 1,
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  cityBar: {
    position: "absolute",
    top: 16,
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 10,
    display: "flex",
    gap: 6,
    background: "#fff",
    padding: "8px 12px",
    borderRadius: 24,
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "90%",
  },
  cityBtn: {
    padding: "5px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    fontSize: 13,
    cursor: "pointer",
    background: "#fff",
    color: "#374151",
    whiteSpace: "nowrap",
  },
  cityBtnActive: {
    background: "#166534",
    color: "#fff",
    border: "1px solid #166534",
  },
  errorBanner: {
    position: "absolute",
    top: 70,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#fee2e2",
    color: "#991b1b",
    padding: "8px 16px",
    borderRadius: 8,
    fontSize: 13,
    zIndex: 10,
    maxWidth: 500,
    textAlign: "center",
  },
  errorPage: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    fontFamily: "sans-serif",
  },
};
