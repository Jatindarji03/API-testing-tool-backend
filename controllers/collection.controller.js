import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import CollectionModel from "../models/collection.model.js";
import ProjectModel from "../models/project.model.js";
import AppResponse from "../utils/AppResponse.js";
import mongoose from "mongoose";
import RequestModel from "../models/request.model.js";
export const createCollection = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { collectionName, collectionDescription, parentCollectionId } =
    req.body;
  if (!projectId || !collectionName) {
    throw new AppError("project id and collection name is required", 400);
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
  const collections = await CollectionModel.find({
    projectId: projectId,
  }).sort({ createdAt: 1 });
  return AppResponse.success(res, { collections }, "Collection Fetched", 200);
});

export const getAllCollectionByProjectTree = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
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

export const deleteCollection = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;
  if (!collectionId) {
    throw new AppError("Collection Id is required", 400);
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const collection =
      await CollectionModel.findById(collectionId).session(session);
    if (!collection) {
      throw new AppError("Collection Not Found", 404);
    }

    const result = await CollectionModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(collectionId),
        },
      },
      {
        $graphLookup: {
          from: "collections",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentCollectionId",
          as: "descendants",
          restrictSearchWithMatch: {
            projectId: collection.projectId,
          },
        },
      },
      { $project: { descendants: 1 } },
    ]).session(session);
    const descendants = result[0]?.descendants ?? [];
    const idsToDelete = [collection._id, ...descendants.map((doc) => doc._id)];

    await RequestModel.deleteMany(
      {
        collectionId: { $in: idsToDelete },
      },
      { session },
    );
    await CollectionModel.deleteMany(
      { _id: { $in: idsToDelete } },
      { session: session },
    );
    await session.commitTransaction();
    session.endSession();
    return AppResponse.success(res, {}, "Collection Deleted", 200);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
});
