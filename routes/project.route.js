import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
import {
  createProject,
  updateProject,
  deleteProject,
  getAllUserProject,
} from "../controllers/project.controller.js";

const projectRoute = Router();
projectRoute.post(
  "/create-project",
  authMiddleware,
  createProject,
);
projectRoute.patch(
  "/update-project/:projectId",
  authMiddleware,
  checkProjectAccess(["owner"]),
  updateProject,
);
projectRoute.delete(
  "/delete-project/:projectId",
  authMiddleware,
  checkProjectAccess(["owner"]),
  deleteProject,
);
projectRoute.get("/all-projects", authMiddleware, getAllUserProject);
export default projectRoute;
