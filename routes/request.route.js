import { Router } from "express";
import {
  deleteRequest,
  getRequestByCollectionId,
  getRequestById,
  saveRequest,
  sendRequest,
  updateRequest,
} from "../controllers/request.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
const requestRouter = Router();

requestRouter.post("/send", sendRequest);
requestRouter.post(
  "/save-request/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor"]),
  saveRequest,
);
requestRouter.delete(
  "/delete-request/:requestId/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor"]),
  deleteRequest,
);
requestRouter.patch(
  "/update-request/:requestId/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor"]),
  updateRequest,
);
requestRouter.get(
  "/get-request/:requestId/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor", "viewer"]),
  getRequestById,
);
requestRouter.get(
  "/collection/get-request/:collectionId/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor", "viewer"]),
  getRequestByCollectionId,
);
export default requestRouter;
