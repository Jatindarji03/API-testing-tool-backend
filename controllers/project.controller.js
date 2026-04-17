import ProjectModel from "../models/project.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppResponse from "../utils/AppResponse.js";
import CollectionModel from "../models/collection.model.js";
import mongoose from "mongoose";
import RequestModel from "../models/request.model.js";
import ProjectMember from "../models/projectMember.model.js";
export const createProject = asyncHandler(async (req, res) => {
  const { projectName } = req.body;
  if (!projectName) {
    throw new AppError("Project Name Is Reqired", 400);
  }
  const project = new ProjectModel({
    projectName: projectName,
    userId: req.user.uid,
  });
  await project.save().catch((err) => {
    throw new AppError("there is something error while saving data", 500, err);
  });
  await ProjectMember.create({
    userId: req.user.uid,
    role: "owner",
    projectId: project._id,
  });
  return AppResponse.success(res, { project }, "Project Created", 201);
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { projectName } = req.body;
  if (!projectName && !projectId) {
    throw new AppError("Project Id and Name is required", 400);
  }
  const updatedProject = await ProjectModel.findOneAndUpdate(
    { _id: projectId },
    { $set: { projectName } },
    { new: true },
  );

  if (!updatedProject) {
    throw new AppError("Project Not Found or Not Authorized", 404);
  }
  return AppResponse.success(
    res,
    { updatedProjectName: updatedProject.projectName },
    "project updated",
    200,
  );
});

export const deleteProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  if (!projectId) {
    throw new AppError("Project Id is Required", 400);
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const project = await ProjectModel.findOne(
      {
        _id: projectId,
      },
      null,
      { session },
    );
    if (!project) {
      throw new AppError("Project not found or you do not have access", 404);
    }
    const collections = await CollectionModel.find(
      {
        projectId: projectId,
      },
      { _id: 1 },
      { session },
    );
    const collectionsIds = collections.map((c) => c._id);
    await RequestModel.deleteMany(
      { collectionId: { $in: collectionsIds } },
      { session },
    );
    await CollectionModel.deleteMany({ projectId: projectId }, { session });
    await ProjectMember.deleteMany({ projectId: projectId }, { session });
    await ProjectModel.deleteOne({ _id: projectId }, { session });
    await session.commitTransaction();
    session.endSession();
    return AppResponse.success(res, {}, "project deleted successfully", 200);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});

export const getAllUserProject = asyncHandler(async (req, res) => {
  const userId = req.user?.uid;

  if (!userId) {
    throw new AppError("inavlid user", 401);
  }

  const memberships = await ProjectMember.find({ userId: userId });

  if (memberships.length === 0) {
    return AppResponse.success(res, [], "No Projects Found", 200);
  }

  const projectIds = memberships.map((m) => m.projectId);
  const projects = await ProjectModel.find({ _id: { $in: projectIds } }).lean();

  const result = projects.map((project) => {
    const membership = memberships.find(
      (m) => m.projectId.toString() === project._id.toString(),
    );
    return { ...project, role: membership.role };
  });
  return AppResponse.success(
    res,
    { projects: result },
    projects.length === 0 ? "No Projects Found" : "Projects Fetched",
    200,
  );
});
