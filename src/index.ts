import express from "express";
import identifyRouter from "./routes/identify.router";

const app = express();
app.use(express.json());

app.listen(8080, () => {
    console.log("Server is running on port 8080");
});

app.use("/", identifyRouter);

app.get("/", (req, res) => {
    res.send("Bitespeed API is running");
});