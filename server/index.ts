import "dotenv/config";
import express from "express";
import cors from "cors";
import restaurantsRouter from "./routes/restaurants.js";
import chatRouter from "./routes/chat.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    "http://localhost:5173",
    /\.vercel\.app$/,
  ]
}));
app.use(express.json());

app.use("/api/restaurants", restaurantsRouter);
app.use("/api/chat", chatRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
