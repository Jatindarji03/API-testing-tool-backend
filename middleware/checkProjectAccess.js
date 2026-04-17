import AppError from "../utils/AppError.js";
import ProjectMember from "../models/projectMember.model.js";
import asyncHandler from "../utils/asyncHandler.js";
export  const checkProjectAccess = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    const { projectId } = req.params;
    const userId = req.user.uid;
    

    const member = await ProjectMember.findOne({
      userId: userId,
      projectId: projectId,
    });
    if (!member) {
      throw new AppError("Access Denied", 403);
    }
    if (roles.length && !roles.includes(member.role)) {
      throw new AppError("Permission Denied", 403);
    }

    req.memberRole = member.role;
    next();
  });
};
