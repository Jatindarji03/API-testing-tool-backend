import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
import {
  createCollection,
  getAllCollectionByProject,
  getAllCollectionByProjectTree,
  deleteCollection,
} from "../controllers/collection.controller.js";
const collectionRoute = Router();
collectionRoute.post(
  "/create-collection/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor"]),
  createCollection,
);
collectionRoute.get(
  "/all-collections/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor", "viewer"]),
  getAllCollectionByProject,
);
collectionRoute.get(
  "/all-collections-tree/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor", "viewer"]),
  getAllCollectionByProjectTree,
);
collectionRoute.delete(
  "/delete-collection/:collectionId/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor"]),
  deleteCollection,
);
export default collectionRoute;
