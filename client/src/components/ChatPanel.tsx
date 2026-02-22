import { useState, useRef, useEffect } from "react";
import type { Restaurant, ChatMessage } from "../types";
import { streamChat } from "../api";

interface Props {
  restaurants: Restaurant[];
}

export default function ChatPanel({ restaurants }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    const assistantMsg: ChatMessage = { role: "assistant", content: "" };
    setMessages((prev) => [...prev, assistantMsg]);

    try {
      for await (const chunk of streamChat(newMessages, restaurants)) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={styles.fab}
        title="Chat with AI guide"
      >
        {open ? "✕" : "💬"}
      </button>

      {/* Chat panel */}
      {open && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span>🌿 AI Food Guide</span>
            <span style={{ fontSize: 12, color: "#6ee7b7" }}>Powered by Claude</span>
          </div>

          <div style={styles.messages}>
            {messages.length === 0 && (
              <div style={styles.welcome}>
                <p>Hi! Ask me anything about vegan dining in Spain.</p>
                <p style={{ marginTop: 8, color: "#9ca3af", fontSize: 13 }}>
                  Try: "Best vegan restaurant in Barcelona?" or "Any restaurants open on Sunday?"
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.userBubble : styles.aiBubble),
                }}
              >
                {msg.content || (streaming && i === messages.length - 1 ? "▋" : "")}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div style={styles.inputRow}>
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask about restaurants…"
              disabled={streaming}
            />
            <button
              style={styles.sendBtn}
              onClick={send}
              disabled={streaming || !input.trim()}
            >
              {streaming ? "…" : "→"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fab: {
    position: "fixed",
    bottom: 28,
    right: 28,
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "#166534",
    color: "#fff",
    border: "none",
    fontSize: 24,
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  panel: {
    position: "fixed",
    bottom: 96,
    right: 28,
    width: 360,
    height: 500,
    background: "#fff",
    borderRadius: 16,
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    zIndex: 999,
  },
  panelHeader: {
    background: "#166534",
    color: "#fff",
    padding: "14px 16px",
    fontWeight: 600,
    fontSize: 15,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messages: {
    flex: 1,
    overflowY: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  welcome: {
    color: "#374151",
    fontSize: 14,
    lineHeight: 1.5,
  },
  bubble: {
    padding: "10px 14px",
    borderRadius: 12,
    fontSize: 14,
    lineHeight: 1.5,
    maxWidth: "88%",
    whiteSpace: "pre-wrap",
  },
  userBubble: {
    background: "#166534",
    color: "#fff",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    background: "#f3f4f6",
    color: "#111827",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  inputRow: {
    display: "flex",
    gap: 8,
    padding: "12px 12px",
    borderTop: "1px solid #e5e7eb",
  },
  input: {
    flex: 1,
    padding: "9px 12px",
    border: "1px solid #d1d5db",
    borderRadius: 24,
    fontSize: 14,
    outline: "none",
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: "50%",
    background: "#166534",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 18,
    fontWeight: 700,
    flexShrink: 0,
  },
};
