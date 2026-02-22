# 🌿 Vegan Spain Map

Interactive map of the best vegan and vegan-friendly restaurants across Spain, with an AI-powered chat guide.

## Features
- 🗺️ Google Maps with color-coded pins (green = 100% vegan, teal = vegan options)
- 🏙️ City selector: Spain-wide, Madrid, Barcelona, Valencia, Seville, and more
- 🌱 Filter by fully vegan vs. vegan-friendly
- 💬 Claude AI chat assistant for personalized recommendations

---

## Setup

### 1. Get a Google API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (e.g. `vegan-spain-map`)
3. Enable these APIs:
   - **Places API**
   - **Maps JavaScript API**
4. Go to **Credentials → Create API Key**
5. *(Recommended)* Restrict it: HTTP referrers for Maps JS, server IP for Places

### 2. Configure environment files

**Server** (`server/.env`):
```
GOOGLE_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

**Client** (`client/.env`):
```
VITE_GOOGLE_MAPS_KEY=your_key_here
```

> You can use the same key for both, or separate keys with different restrictions.

### 3. Install dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 4. Run

Open two terminals:

```bash
# Terminal 1 — server
cd server && npm run dev

# Terminal 2 — client
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Project Structure

```
vegan-spain-map/
├── server/
│   ├── index.ts              # Express app
│   ├── routes/
│   │   ├── restaurants.ts    # Google Places proxy + dedup
│   │   └── chat.ts           # Claude AI streaming endpoint
│   └── .env                  # GOOGLE_API_KEY, ANTHROPIC_API_KEY
└── client/
    ├── src/
    │   ├── App.tsx            # Layout + city selector
    │   ├── api.ts             # fetch helpers
    │   ├── types.ts           # shared types
    │   └── components/
    │       ├── Map.tsx        # Google Maps + markers
    │       ├── Sidebar.tsx    # Restaurant list + filters
    │       └── ChatPanel.tsx  # Claude AI chat UI
    └── .env                   # VITE_GOOGLE_MAPS_KEY
```
