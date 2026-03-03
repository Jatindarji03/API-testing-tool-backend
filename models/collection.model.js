import mongoose, { Mongoose } from "mongoose";
const collectionSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "project",
    required: true,
  },
  collectionName: {
    type: String,
    required: true,
    trim: true,
  },
  parentCollectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "collection",
    default: null,
  },
  collectionDescription: {
    type: String,
    default: "",
  },
  envVariable: [
    {
      key: { type: String, required: true },
      value: { type: String, required: true },
    },
  ],
});
const collectionModel = mongoose.model('collection',collectionSchema);
export default collectionModel;