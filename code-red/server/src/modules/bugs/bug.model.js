import mongoose from "mongoose";

const bugStatus = ["open", "in-progress", "resolved", "closed"];
const bugPriority = ["critical", "high", "medium", "low"];
const bugSeverity = ["critical", "high", "medium", "low"];

const historySchema = new mongoose.Schema(
  {
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    field: {
      type: String,
      required: true,
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const commentSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true },
);

const githubLinkSchema = new mongoose.Schema(
  {
    sha: {
      type: String,
      required: true,
    },
    commitUrl: {
      type: String,
      default: "",
    },
    prUrl: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      default: "",
    },
    linkedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const bugSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    steps_to_reproduce: {
      type: String,
      default: "",
    },
    expected: {
      type: String,
      default: "",
    },
    actual: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: bugStatus,
      default: "open",
    },
    priority: {
      type: String,
      enum: bugPriority,
      default: "medium",
    },
    severity: {
      type: String,
      enum: bugSeverity,
      default: "medium",
    },
    suggestedFix: {
      type: String,
      default: "",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignees: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    triageLabels: {
      type: [String],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    history: {
      type: [historySchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    embedding: {
      type: [Number],
      default: [],
    },
    githubLinks: {
      type: [githubLinkSchema],
      default: [],
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

bugSchema.index({ project: 1, status: 1, priority: 1, createdAt: -1 });
bugSchema.index({ title: "text", description: "text" });

export { bugStatus, bugPriority, bugSeverity };
export default mongoose.model("Bug", bugSchema);
