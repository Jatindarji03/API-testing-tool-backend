import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
import {
  inviteMember,
  getMembers,
} from "../controllers/projectMember.controller.js";
import asyncHandler from "../utils/asyncHandler.js";
const projectMemberRoutes = Router();

projectMemberRoutes.post("/invite/:projectId", authMiddleware, inviteMember);
projectMemberRoutes.get("/:projectId", authMiddleware, getMembers);

export default projectMemberRoutes;
