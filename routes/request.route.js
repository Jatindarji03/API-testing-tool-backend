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
const requestRouter = Router();

requestRouter.post("/send", sendRequest);
requestRouter.post("/save-request", authMiddleware, saveRequest);
requestRouter.delete(
  "/delete-request/:requestId",
  authMiddleware,
  deleteRequest,
);
requestRouter.patch(
  "/update-request/:requestId",
  authMiddleware,
  updateRequest,
);
requestRouter.get("/get-request/:requestId", authMiddleware, getRequestById);
requestRouter.get(
  "/collection/get-request/:collectionId",
  authMiddleware,
  getRequestByCollectionId,
);
export default requestRouter;
