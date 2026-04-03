import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
import {
  inviteMember,
  getMembers,
} from "../controllers/projectMember.controller.js";
const projectMemberRoutes = Router();

projectMemberRoutes.post(
  "/invite/:projectId",
  authMiddleware,
  checkProjectAccess(["owner"]),
  inviteMember,
);
projectMemberRoutes.get(
  "/:projectId",
  authMiddleware,
  checkProjectAccess(["owner", "editor", "viewer"]),
  getMembers,
);

export default projectMemberRoutes;
