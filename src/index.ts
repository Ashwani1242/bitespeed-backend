import express from "express";
import identifyRouter from "./routes/identify.router";
import cleanRouter from "./routes/clean-db.router";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors());

app.listen(process.env.PORT || 8080, () => {
    console.log("Server is running on port 8080");
});

app.use("/", identifyRouter);
app.use("/", cleanRouter);

app.get("/", (req, res) => {
    res.send("Bitespeed API is running");
});