import express from "express";
import identifyContact from "../controllers/identify.controller";

const identifyRouter = express.Router();

identifyRouter.post("/identify", identifyContact);

export default identifyRouter;