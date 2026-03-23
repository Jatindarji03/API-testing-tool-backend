import ProjectModel from "../models/project.model.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import AppResponse from "../utils/AppResponse.js";
import CollectionModel from "../models/collection.model.js";
import mongoose from "mongoose";
import RequestModel from "../models/request.model.js";
export const createProject = asyncHandler(async (req, res) => {
  const { projectName } = req.body;
  console.log("CREATE CONTROLLER HIT");
  if (!projectName) {
    throw new AppError("Project Name Is Reqired", 400);
  }
  const project = new ProjectModel({
    projectName: projectName,
    userId: req.user.uid,
  });
  await project.save().catch((err) => {
    console.log("there is something error while saving data");
    throw new AppError("there is something error while saving data", 500, err);
  });
  return AppResponse.success(res, { project }, "Project Created", 201);
});

export const updateProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { projectName } = req.body;
  console.log(projectId);
  if (!projectName && !projectId) {
    throw new AppError("Project Id and Name is required", 400);
  }
  const updatedProject = await ProjectModel.findOneAndUpdate(
    { _id: projectId, userId: req.user.uid },
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
  const userId = req.user?.uid;
  if (!projectId) {
    throw new AppError("Project Id is Required", 400);
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const project = await ProjectModel.findOne(
      {
        _id: projectId,
        userId: userId,
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
  const projects = await ProjectModel.find({ userId: userId });
  return AppResponse.success(
    res,
    { projects },
    projects.length === 0 ? "No Projects Found" : "Projects Fetched",
    200,
  );
});
