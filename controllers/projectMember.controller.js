import ProjectMemberModel from "../models/projectMember.model.js";
import UserModel from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import AppResponse from "../utils/AppResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const inviteMember = asyncHandler(async (req, res) => {
  const { role, email } = req.body;
  const {projectId} = req.params;
  if (!role) {
    throw new AppError("role is required", 400);
  }
  if (!email) {
    throw new AppError("Email is Required", 400);
  }
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    throw new AppError("User Not Found",404);
  }
  const existingMember = await ProjectMemberModel.findOne({
    userId: user.uid,
    projectId,
  });
  if (existingMember) throw new AppError("User is already a member", 409);
  const member = await ProjectMemberModel.create({
    userId: user.uid,
    projectId: projectId,
    role: role,
  });
  return AppResponse.success(res, {member}, "Invited", 201);
});
