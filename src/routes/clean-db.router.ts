import express from "express";
import cleanDatabase from "../controllers/clean-db.controller";

const cleanRouter = express.Router();

cleanRouter.delete("/clean-db", cleanDatabase);

export default cleanRouter; 