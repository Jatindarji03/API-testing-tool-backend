import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import AppResponse from "../utils/AppResponse.js";
import CollectionModel from "../models/collection.model.js";
import ProjectModel from "../models/project.model.js";
import RequestModel from "../models/request.model.js";
import axios from "axios";
import mongoose from "mongoose";

export const sendRequest = asyncHandler(async (req, res) => {
  const { apiUrl, method, header = [], params = [], body, bodyType } = req.body;
  if (!apiUrl || !method) {
    throw new AppError("Api url and method is required", 400);
  }
  const headerObject = {};
  header.forEach((item) => {
    if (item.key) {
      headerObject[item.key] = item.value;
    }
  });

  const paramsObject = {};
  params.forEach((item) => {
    if (item.key) {
      paramsObject[item.key] = item.value;
    }
  });

  const startTime = Date.now();

  try {
    const response = await axios({
      url: apiUrl,
      method: method,
      headers: headerObject,
      params: paramsObject,
      data: bodyType === "json" ? body : undefined,
    });
    const responseTime = Date.now() - startTime;
    return AppResponse.success(
      res,
      {
        status: response.status,
        time: `${responseTime} ms`,
        headers: response.headers,
        response: response.data,
      },
      "Request executed successfully",
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error.response) {
      return AppResponse.success(
        res,
        {
          status: error.response.status,
          time: `${responseTime} ms`,
          header: error.response.headers,
          response: error.response.data,
        },
        "Request executed with error response",
      );
    }
    throw new AppError("Failed to send request", 500);
  }
});

export const saveRequest = asyncHandler(async (req, res) => {
  const {
    collectionId,
    apiName,
    method,
    apiUrl,
    header = [],
    params = [],
    body = null,
    bodyType,
  } = req.body;
  if (!collectionId || !apiName || !apiUrl || !method) {
    throw new AppError(
      "Collection Id , Api Name , ApiUrl and Method is required",
      400,
    );
  }
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    throw new AppError("Invalid Collection Id", 400);
  }
  const collection = await CollectionModel.findById(collectionId);
  if (!collection) {
    throw new AppError("Collection Not Found", 404);
  }
  const project = await ProjectModel.findOne({
    _id: collection.projectId,
    userId: req.user.uid,
  });
  if (!project) {
    throw new AppError(
      "You dont have access to create an api into this project",
      403,
    );
  }
  const request = await RequestModel.create({
    collectionId: collectionId,
    apiName: apiName,
    method: method,
    apiUrl: apiUrl,
    header: header,
    params: params,
    body: body,
    bodyType: bodyType,
  });
  return AppResponse.success(res, { request }, "Request Saved", 201);
});

export const deleteRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  if (!requestId) {
    throw new AppError("Request Id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid Request Id", 400);
  }
  const request = await RequestModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(requestId),
      },
    },
    {
      $lookup: {
        from: "collections",
        localField: "collectionId",
        foreignField: "_id",
        as: "collections",
      },
    },
    {
      $unwind: "$collections",
    },
    {
      $lookup: {
        from: "projects",
        localField: "collections.projectId",
        foreignField: "_id",
        as: "projects",
      },
    },
    {
      $unwind: "$projects",
    },
    {
      $match: {
        "projects.userId": req.user.uid,
      },
    },
  ]);
  if (!request.length) {
    throw new AppError("Request not found or access denied", 403);
  }
  await RequestModel.deleteOne({ _id: requestId });
  return AppResponse.success(res, {}, "Request Deleted", 200);
});

export const updateRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const updatedData = {};
  const { method, apiUrl, header, params, body, bodyType } = req.body;
  if (!requestId) {
    throw new AppError("Request Id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid Request Id", 400);
  }
  const request = await RequestModel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(requestId),
      },
    },
    {
      $lookup: {
        from: "collections",
        localField: "collectionId",
        foreignField: "_id",
        as: "collections",
      },
    },
    {
      $unwind: "$collections",
    },
    {
      $lookup: {
        from: "projects",
        localField: "collections.projectId",
        foreignField: "_id",
        as: "projects",
      },
    },
    {
      $unwind: "$projects",
    },
    {
      $match: {
        "projects.userId": req.user.uid,
      },
    },
  ]);
  if (!request.length) {
    throw new AppError("Request not found or access denied", 403);
  }

  if (method) updatedData.method = method;
  if (apiUrl) updatedData.apiUrl = apiUrl;
  if (header) updatedData.header = header;
  if (params) updatedData.params = params;
  if (body) updatedData.body = body;
  if (bodyType) updatedData.bodyType = bodyType;
  const updatedRequest = await RequestModel.findByIdAndUpdate(
    requestId,
    { $set: updatedData },
    { new: true },
  );
  return AppResponse.success(res, { updatedRequest }, "request updated", 200);
});

export const getRequestById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  if (!requestId) {
    throw new AppError("Request Id is required", 400);
  }
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    throw new AppError("Invalid Request Id", 400);
  }
  const request = await RequestModel.findOne({ _id: requestId });
  if (!request) {
    throw new AppError("Request Not Found", 404);
  }
  return AppResponse.success(res, { request }, "Request Fetched", 200);
});

export const getRequestByCollectionId = asyncHandler(async (req, res) => {
  const { collectionId } = req.params;
  if (!collectionId) {
    throw new AppError("Collection Id is required");
  }
  if (!mongoose.Types.ObjectId.isValid(collectionId)) {
    throw new AppError("Invalid Collection Id", 400);
  }
  const collection = await CollectionModel.findById(collectionId);
  if (!collection) {
    throw new AppError("Collection Not Found", 404);
  }

  const project = await ProjectModel.findOne({
    _id: collection.projectId,
    userId: req.user.uid,
  });
  if (!project) {
    throw new AppError("Access Denied", 403);
  }
  const request = await RequestModel.find(
    { collectionId: collectionId },
    { _id: 1, apiName: 1, method: 1 },
  );
  return AppResponse.success(res, { request }, "Request Fetched", 200);
});
