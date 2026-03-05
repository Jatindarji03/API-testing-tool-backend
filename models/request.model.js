import mongoose, { mongo } from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    collectionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "collection",
      required: true,
    },
    apiName: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      required: true,
    },
    apiUrl: {
      type: String,
      required: true,
    },
    header: [
      {
        key: String,
        value: String,
      },
    ],
    params: [
      {
        key: String,
        value: String,
      },
    ],
    body: {
      type: mongoose.Schema.Types.Mixed,
    },
    bodyType: {
      type: String,
      enum: ["none", "json", "form-data"],
      required: true,
    },
  },
  { timestamps: true },
);

const requestModel = mongoose.model("request", requestSchema);
export default requestModel;
