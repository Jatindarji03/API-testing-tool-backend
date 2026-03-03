import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import CollectionModel from "../models/collection.model.js";
import ProjectModel from "../models/project.model.js";
import AppResponse from "../utils/AppResponse.js";
import mongoose from "mongoose";
export const createCollection = asyncHandler(async (req, res) => {
  const {
    projectId,
    collectionName,
    collectionDescription,
    parentCollectionId,
  } = req.body;
  if (!projectId && !collectionName) {
    throw new AppError("project id and collection name is required", 400);
  }

  //checking if the project is valid to particular user
  const project = await ProjectModel.findOne({
    _id: projectId,
    userId: req.user.uid,
  });

  if (!project) {
    throw new AppError("project not found or access denied it", 403);
  }
  if (parentCollectionId) {
    const parentCollection = await CollectionModel.findOne({
      _id: parentCollectionId,
      projectId: projectId,
    });
    if (!parentCollection) {
      throw new AppError("Invalid Parent Collection", 400);
    }
  }
  const collection = await CollectionModel.create({
    projectId: projectId,
    collectionName: collectionName,
    collectionDescription: collectionDescription,
    parentCollectionId: parentCollectionId,
  });
  return AppResponse.success(res, { collection }, "collection created", 201);
});

export const getAllCollectionByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await ProjectModel.find({
    userId: req.user.uid,
    _id: projectId,
  });
  if (!project) {
    throw new AppError("Project Not Found or Access Denied", 403);
  }
  const collections = await CollectionModel.find({
    projectId: projectId,
  }).sort({ createdAt: 1 });
  return AppResponse.success(res, { collections }, "Collection Fetched", 200);
});

export const getAllCollectionByProjectTree = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const project = await ProjectModel.find({
    userId: req.user.uid,
    _id: projectId,
  });
  if (!project) {
    throw new AppError("Project Not Found or Access Denied", 403);
  }
  const objectProjectId = new mongoose.Types.ObjectId(projectId);

  const collections = await CollectionModel.aggregate([
    {
      $match: {
        projectId: objectProjectId,
        parentCollectionId: null,
      },
    },
    {
      $graphLookup: {
        from: "collections",
        startWith: "$_id",
        connectFromField: "_id",
        connectToField: "parentCollectionId",
        as: "children",
        restrictSearchWithMatch: {
          projectId: objectProjectId,
        },
      },
    },
    {
      $project: {
        _id: 1,
        collectionName: 1,
        children: {
          $map: {
            input: "$children",
            as: "child",
            in: {
              _id: "$$child._id",
              collectionName: "$$child.collectionName",
            },
          },
        },
      },
    },
  ]);

  return AppResponse.success(res, { collections }, "collection fetched", 200);
});
