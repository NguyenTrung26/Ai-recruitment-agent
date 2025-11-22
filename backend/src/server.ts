import express from "express";
import { config } from "./config.js";
import candidateRoutes from "./routes/candidate.routes.js";
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to the AI Recruitment Agent API");
});

app.use("/api", candidateRoutes);

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
