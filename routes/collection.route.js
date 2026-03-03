import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  createCollection,
  getAllCollectionByProject,
  getAllCollectionByProjectTree,
} from "../controllers/collection.controller.js";
const collectionRoute = Router();
collectionRoute.post("/create-collection", authMiddleware, createCollection);
collectionRoute.get(
  "/all-collections/:projectId",
  authMiddleware,
  getAllCollectionByProject,
);
collectionRoute.get(
  "/all-collections-tree/:projectId",
  authMiddleware,
  getAllCollectionByProjectTree,
);
export default collectionRoute;
