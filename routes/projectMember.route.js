import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { checkProjectAccess } from "../middleware/checkProjectAccess.js";
import { inviteMember } from "../controllers/projectMember.controller.js";
const projectMemberRoutes = Router();

projectMemberRoutes.post("/invite/:projectId", authMiddleware, inviteMember);

export default projectMemberRoutes;
