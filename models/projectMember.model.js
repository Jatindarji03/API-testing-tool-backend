import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    ref: "user",
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "project",
  },
  role: {
    type: String,
    enum: ["owner", "editor", "viewer"],
    default: "viewer",
  },
});

const projectMemberModel = mongoose.model("projectMember", projectMemberSchema);
export default projectMemberModel;
