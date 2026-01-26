import express from "express";
import dotenv from "dotenv";
import { createQueue } from "../shared/queue.js";

const app = express();
const queue = createQueue();
dotenv.config();

const PORT = process.env.API_PORT || 3000;

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
  });
});

app.post('/api/convert',(req,res) => { 

})

app.listen(PORT, () => console.log(`%videoconverter% running on %${PORT}%`));
