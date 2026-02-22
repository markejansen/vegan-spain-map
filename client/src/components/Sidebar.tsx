import { useState } from "react";
import type { Restaurant } from "../types";
import { photoUrl } from "../api";

interface Props {
  restaurants: Restaurant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

type Filter = "all" | "vegan" | "options";

const priceLabel = (level: number | null) =>
  level != null ? "€".repeat(level + 1) : "";

export default function Sidebar({ restaurants, selectedId, onSelect, loading }: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = restaurants.filter((r) => {
    if (filter === "vegan") return r.isFullyVegan;
    if (filter === "options") return !r.isFullyVegan;
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => (prev === id ? null : id));
    onSelect(id);
  };

  return (
    <aside style={styles.sidebar}>
      <div style={styles.header}>
        <h1 style={styles.title}>🌿 Vegan Spain</h1>
        <p style={styles.subtitle}>Best spots across Spain</p>
        <div style={styles.filters}>
          {(["all", "vegan", "options"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
            >
              {f === "all" ? "All" : f === "vegan" ? "🌱 Vegan Only" : "🥗 Vegan Options"}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.list}>
        {loading && (
          <div style={styles.loading}>Loading restaurants…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={styles.loading}>No restaurants found.</div>
        )}
        {filtered.map((r) => (
          <div
            key={r.id}
            style={{
              ...styles.card,
              ...(selectedId === r.id ? styles.cardSelected : {}),
            }}
            onClick={() => toggleExpand(r.id)}
          >
            <div style={styles.cardTop}>
              <div style={styles.cardInfo}>
                <span
                  style={{
                    ...styles.badge,
                    background: r.isFullyVegan ? "#dcfce7" : "#ccfbf1",
                    color: r.isFullyVegan ? "#166534" : "#134e4a",
                  }}
                >
                  {r.isFullyVegan ? "🌱 Vegan" : "🥗 Vegan Options"}
                </span>
                <h3 style={styles.cardName}>{r.name}</h3>
                <div style={styles.cardMeta}>
                  {r.rating > 0 && (
                    <span>⭐ {r.rating.toFixed(1)} ({r.reviewCount})</span>
                  )}
                  {priceLabel(r.priceLevel) && (
                    <span style={{ marginLeft: 8, color: "#6b7280" }}>
                      {priceLabel(r.priceLevel)}
                    </span>
                  )}
                  {r.openNow != null && (
                    <span
                      style={{
                        marginLeft: 8,
                        color: r.openNow ? "#16a34a" : "#dc2626",
                        fontSize: 12,
                      }}
                    >
                      {r.openNow ? "Open" : "Closed"}
                    </span>
                  )}
                </div>
                <p style={styles.address}>{r.address}</p>
              </div>
              {r.photoRef && (
                <img
                  src={photoUrl(r.photoRef)}
                  alt={r.name}
                  style={styles.thumb}
                  loading="lazy"
                />
              )}
            </div>

            {expanded === r.id && (
              <div style={styles.expanded}>
                <a
                  href={r.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.link}
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in Google Maps ↗
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: 360,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#fff",
    borderRight: "1px solid #e5e7eb",
    flexShrink: 0,
  },
  header: {
    padding: "20px 16px 12px",
    borderBottom: "1px solid #e5e7eb",
  },
  title: { fontSize: 22, fontWeight: 700, color: "#166534" },
  subtitle: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  filters: { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" },
  filterBtn: {
    padding: "5px 10px",
    border: "1px solid #d1d5db",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    background: "#fff",
    color: "#374151",
  },
  filterBtnActive: {
    background: "#166534",
    color: "#fff",
    border: "1px solid #166534",
  },
  list: { flex: 1, overflowY: "auto", padding: "8px 0" },
  loading: { padding: 24, textAlign: "center", color: "#9ca3af" },
  card: {
    padding: "12px 16px",
    borderBottom: "1px solid #f3f4f6",
    cursor: "pointer",
    transition: "background 0.15s",
  },
  cardSelected: { background: "#f0fdf4" },
  cardTop: { display: "flex", gap: 12, alignItems: "flex-start" },
  cardInfo: { flex: 1, minWidth: 0 },
  badge: {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 4,
  },
  cardName: { fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 4 },
  cardMeta: { fontSize: 13, color: "#374151", marginBottom: 4 },
  address: { fontSize: 12, color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  thumb: { width: 72, height: 72, objectFit: "cover", borderRadius: 8, flexShrink: 0 },
  expanded: { marginTop: 10 },
  link: {
    fontSize: 13,
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: 500,
  },
};
