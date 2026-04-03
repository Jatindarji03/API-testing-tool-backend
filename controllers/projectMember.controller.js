import ProjectMemberModel from "../models/projectMember.model.js";
import UserModel from "../models/user.model.js";
import AppError from "../utils/AppError.js";
import AppResponse from "../utils/AppResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
export const inviteMember = asyncHandler(async (req, res) => {
  const { role, email } = req.body;
  const { projectId } = req.params;
  if (!role) {
    throw new AppError("role is required", 400);
  }
  if (!email) {
    throw new AppError("Email is Required", 400);
  }
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    throw new AppError("User Not Found", 404);
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
  return AppResponse.success(res, { member }, "Invited", 201);
});

export const getMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const members = await ProjectMemberModel.aggregate([
    {
      $match: { projectId: new mongoose.Types.ObjectId(projectId) },
    },
    {
      $lookup: {
        from: "users",      
        localField: "userId", 
        foreignField: "uid", 
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 1,
        role: 1,
        "user.email": 1,
        "user.uid": 1,
      },
    },
  ]);

  return AppResponse.success(res, members, "Members Fetched", 200);
});
