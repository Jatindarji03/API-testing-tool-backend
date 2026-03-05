import asyncHandler from "../utils/asyncHandler.js";
import AppError from "../utils/AppError.js";
import AppResponse from "../utils/AppResponse.js";
import { response } from "express";
import axios from "axios";

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
