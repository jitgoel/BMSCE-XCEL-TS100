import mongoose from "mongoose";
import { env } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";
import { getEmbedding, triageBug } from "../ai/ai.service.js";
import Project from "../projects/project.model.js";
import User from "../users/user.model.js";
import Bug from "./bug.model.js";

const BUG_ACTIONS = {
  DELETE: "delete_bug",
  CHANGE_STATUS: "change_status",
  ASSIGN: "assign_bug",
  CLOSE: "close_bug",
};

const BUG_ROLE_ACTION_MATRIX = {
  admin: [
    BUG_ACTIONS.DELETE,
    BUG_ACTIONS.CHANGE_STATUS,
    BUG_ACTIONS.ASSIGN,
    BUG_ACTIONS.CLOSE,
  ],
  developer: [
    BUG_ACTIONS.DELETE,
    BUG_ACTIONS.CHANGE_STATUS,
    BUG_ACTIONS.ASSIGN,
  ],
  reporter: [BUG_ACTIONS.CHANGE_STATUS, BUG_ACTIONS.ASSIGN],
};

const normalizeRole = (role) => (role === "tester" ? "reporter" : role);

const hasRoleBugAction = (user, action) =>
  BUG_ROLE_ACTION_MATRIX[normalizeRole(user.role)]?.includes(action) || false;

const mutableFields = [
  "title",
  "description",
  "steps_to_reproduce",
  "expected",
  "actual",
  "status",
  "priority",
  "severity",
  "assignees",
  "tags",
  "attachments",
  "dueDate",
  "suggestedFix",
];

const populateBugQuery = (query) =>
  query
    .populate("reporter", "name email role avatar")
    .populate("assignees", "name email role avatar")
    .populate("history.changedBy", "name email role avatar")
    .populate("comments.author", "name email role avatar")
    .populate({
      path: "project",
      select: "name description owner members tags",
      populate: [
        { path: "owner", select: "name email role avatar" },
        { path: "members.user", select: "name email role avatar" },
      ],
    });

const asString = (value) =>
  value === null || value === undefined ? "" : String(value);

const normalizeArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .filter(Boolean)
        .map((item) =>
          typeof item === "string" ? item.trim() : asString(item),
        ),
    ),
  ];
};

const MAX_BUG_SEARCH_LENGTH = 120;

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const areEqual = (left, right) =>
  JSON.stringify(left) === JSON.stringify(right);

const isProjectMember = (project, userId) => {
  const uid = String(userId || "").trim();
  return project.members.some(
    (member) => member.user.toString().trim() === uid,
  );
};

const canAccessProject = (project, user) => {
  const uid = String(user.id || user.userId || "").trim();
  return (
    user.role === "admin" ||
    project.owner.toString().trim() === uid ||
    isProjectMember(project, uid)
  );
};

const collectProjectMemberIds = (project) => {
  const ids = new Set();

  const ownerId = String(project?.owner || "").trim();
  if (ownerId) {
    ids.add(ownerId);
  }

  (project?.members || []).forEach((member) => {
    const memberId = String(member?.user || "").trim();
    if (memberId) {
      ids.add(memberId);
    }
  });

  return ids;
};

const resolveAssigneeIds = async (assignees) => {
  const normalizedTokens = normalizeArray(assignees)
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (normalizedTokens.length === 0) {
    return [];
  }

  const objectIdTokens = [
    ...new Set(
      normalizedTokens.filter((token) => mongoose.Types.ObjectId.isValid(token)),
    ),
  ];

  const emailTokens = [
    ...new Set(
      normalizedTokens
        .filter((token) => !mongoose.Types.ObjectId.isValid(token))
        .map((token) => token.toLowerCase()),
    ),
  ];

  const objectIdSet = new Set();
  if (objectIdTokens.length > 0) {
    const matchedById = await User.find({
      _id: { $in: objectIdTokens },
    })
      .select("_id")
      .lean();

    matchedById.forEach((row) => {
      objectIdSet.add(row._id.toString());
    });
  }

  const emailToId = new Map();
  if (emailTokens.length > 0) {
    const matchedUsers = await User.find({
      email: { $in: emailTokens },
    })
      .select("_id email")
      .lean();

    matchedUsers.forEach((row) => {
      emailToId.set(String(row.email || "").toLowerCase(), row._id.toString());
    });
  }

  const resolvedAssigneeIds = [];
  const unresolvedTokens = [];

  normalizedTokens.forEach((token) => {
    if (mongoose.Types.ObjectId.isValid(token)) {
      if (objectIdSet.has(token)) {
        resolvedAssigneeIds.push(token);
      } else {
        unresolvedTokens.push(token);
      }
      return;
    }

    const resolvedFromEmail = emailToId.get(token.toLowerCase());
    if (resolvedFromEmail) {
      resolvedAssigneeIds.push(resolvedFromEmail);
      return;
    }

    unresolvedTokens.push(token);
  });

  if (unresolvedTokens.length > 0) {
    throw new ApiError(
      400,
      `Assignee not found or invalid: ${unresolvedTokens.join(", ")}`,
    );
  }

  return [...new Set(resolvedAssigneeIds)];
};

const assertAssigneesAreProjectMembers = async (project, assignees) => {
  const normalizedAssigneeIds = await resolveAssigneeIds(assignees);

  if (normalizedAssigneeIds.length === 0) {
    return normalizedAssigneeIds;
  }

  const projectMemberIds = collectProjectMemberIds(project);
  const nonMemberIds = normalizedAssigneeIds.filter(
    (id) => !projectMemberIds.has(id),
  );

  if (nonMemberIds.length > 0) {
    throw new ApiError(
      400,
      "Assignees must be project members. Add them to the project first.",
    );
  }

  return normalizedAssigneeIds;
};

const canDeleteBugByPolicy = ({ bug, project, user }) => {
  const uid = String(user.id || user.userId || "").trim();
  const isOwnBug = bug.reporter.toString().trim() === uid;
  const isProjectOwner = project?.owner?.toString().trim() === uid;

  return (
    hasRoleBugAction(user, BUG_ACTIONS.DELETE) || isOwnBug || isProjectOwner
  );
};

export async function assertProjectAccess(projectId, user) {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!canAccessProject(project, user)) {
    throw new ApiError(403, "Forbidden: not authorized for project");
  }

  return project;
}

async function getAccessibleProjectIds(user) {
  if (user.role === "admin") {
    const all = await Project.find({}).select("_id");
    return all.map((project) => project._id.toString());
  }

  const projects = await Project.find({
    $or: [{ owner: user.id }, { "members.user": user.id }],
  }).select("_id");

  return projects.map((project) => project._id.toString());
}

async function findSimilarBugs({
  bugId = null,
  projectId,
  embedding,
  queryText,
}) {
  if (!embedding?.length) {
    return [];
  }

  try {
    const similarityMatch = {
      score: { $gte: env.BUG_SIMILARITY_THRESHOLD },
    };

    if (bugId) {
      similarityMatch._id = { $ne: new mongoose.Types.ObjectId(bugId) };
    }

    const similarRows = await Bug.aggregate([
      {
        $vectorSearch: {
          index: "bug_embedding_index",
          path: "embedding",
          queryVector: embedding,
          numCandidates: 150,
          limit: 4,
          filter: {
            project: new mongoose.Types.ObjectId(projectId),
          },
        },
      },
      {
        $project: {
          title: 1,
          status: 1,
          priority: 1,
          severity: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
      {
        $match: similarityMatch,
      },
      { $limit: 3 },
    ]);

    return similarRows;
  } catch (error) {
    logger.warn("Vector search failed; using token fallback", error.message);

    const fallbackTerms = String(queryText || "")
      .toLowerCase()
      .split(/\s+/)
      .map((term) => term.replace(/[^a-z0-9]/gi, "").trim())
      .filter((term) => term.length > 3)
      .slice(0, 8);

    if (fallbackTerms.length === 0) {
      return [];
    }

    try {
      const fallbackFilter = {
        project: projectId,
      };

      if (bugId) {
        fallbackFilter._id = { $ne: bugId };
      }

      const candidates = await Bug.find(fallbackFilter)
        .select("title description status priority severity updatedAt")
        .sort({ updatedAt: -1 })
        .limit(80)
        .lean();

      const ranked = candidates
        .map((row) => {
          const haystack =
            `${String(row.title || "")} ${String(row.description || "")}`.toLowerCase();

          const matchCount = fallbackTerms.reduce(
            (count, term) => (haystack.includes(term) ? count + 1 : count),
            0,
          );

          return {
            ...row,
            _matchCount: matchCount,
          };
        })
        .filter((row) => row._matchCount > 0)
        .sort((left, right) => right._matchCount - left._matchCount)
        .slice(0, 3)
        .map((row) => ({
          _id: row._id,
          title: row.title,
          status: row.status,
          priority: row.priority,
          severity: row.severity,
          score: null,
        }));

      return ranked;
    } catch (fallbackError) {
      logger.warn(
        "Token fallback failed; duplicate detection will return empty result",
        fallbackError.message,
      );
      return [];
    }
  }
}

export async function preflightDuplicateCheck(payload, user) {
  await assertProjectAccess(payload.project, user);

  const title = String(payload.title || "").trim();
  const description = String(payload.description || "").trim();

  const embedding = await getEmbedding(`${title}\n${description}`);
  const similarBugs = await findSimilarBugs({
    projectId: payload.project,
    embedding,
    queryText: `${title} ${description}`,
  });

  return {
    similarBugs,
  };
}

const buildHistoryEntries = (existingBug, updates, userId) => {
  const entries = [];

  mutableFields.forEach((field) => {
    if (updates[field] === undefined) {
      return;
    }

    let nextValue = updates[field];
    if (["tags", "attachments"].includes(field)) {
      nextValue = normalizeArray(updates[field]);
    }

    if (field === "assignees") {
      nextValue = normalizeArray(updates[field]);
    }

    if (field === "dueDate") {
      nextValue = nextValue ? new Date(nextValue) : null;
    }

    const previousValue = existingBug[field];
    if (!areEqual(previousValue, nextValue)) {
      existingBug[field] = nextValue;
      entries.push({
        changedBy: userId,
        field,
        oldValue: previousValue,
        newValue: nextValue,
        timestamp: new Date(),
      });
    }
  });

  if (updates.status && ["resolved", "closed"].includes(updates.status)) {
    if (!existingBug.resolvedAt) {
      existingBug.resolvedAt = new Date();
    }
  } else if (
    updates.status &&
    ["open", "in-progress"].includes(updates.status)
  ) {
    existingBug.resolvedAt = null;
  }

  return entries;
};

export async function createBug(payload, user, io) {
  const project = await assertProjectAccess(payload.project, user);
  const assignees = await assertAssigneesAreProjectMembers(
    project,
    payload.assignees,
  );

  const bug = await Bug.create({
    title: payload.title,
    description: payload.description,
    steps_to_reproduce: payload.steps_to_reproduce,
    expected: payload.expected,
    actual: payload.actual,
    status: payload.status || "open",
    priority: payload.priority || "medium",
    severity: payload.severity || "medium",
    project: payload.project,
    reporter: user.id,
    assignees,
    tags: normalizeArray(payload.tags),
    attachments: normalizeArray(payload.attachments),
    dueDate: payload.dueDate || null,
  });

  const triage = await triageBug(bug.title, bug.description);
  const embedding = await getEmbedding(`${bug.title}\n${bug.description}`);

  bug.severity = payload.severity || triage.severity || bug.severity;
  bug.priority = payload.priority || triage.priority || bug.priority;
  bug.suggestedFix = triage.suggestedFix || "";
  bug.triageLabels = normalizeArray(triage.labels);
  bug.tags = [...new Set([...(bug.tags || []), ...bug.triageLabels])];

  if (embedding.length > 0) {
    bug.embedding = embedding;
  }

  await bug.save();

  const similarBugs = await findSimilarBugs({
    bugId: bug._id,
    projectId: bug.project,
    embedding,
    queryText: `${bug.title} ${bug.description}`,
  });

  const savedBug = await populateBugQuery(Bug.findById(bug._id));

  io?.to(`project:${bug.project.toString()}`).emit("activity:new", {
    type: "bug:created",
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    bugTitle: bug.title,
    actorId: user.id,
    timestamp: new Date().toISOString(),
  });

  return {
    bug: savedBug,
    triage,
    similarBugs,
  };
}

export async function getBugs(query, user) {
  const accessibleProjectIds = await getAccessibleProjectIds(user);
  if (accessibleProjectIds.length === 0) {
    return [];
  }

  const filter = {
    project: query.project || { $in: accessibleProjectIds },
  };

  if (query.project && !accessibleProjectIds.includes(query.project)) {
    throw new ApiError(403, "Forbidden: no access to this project");
  }

  if (query.status) {
    filter.status = query.status;
  }
  if (query.priority) {
    filter.priority = query.priority;
  }
  if (query.assignee) {
    filter.assignees = query.assignee;
  }

  if (query.search) {
    const normalizedSearch = String(query.search)
      .trim()
      .slice(0, MAX_BUG_SEARCH_LENGTH);

    if (normalizedSearch) {
      const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }
  }

  const sortBy = query.sortBy || "updatedAt";
  const sortOrder = query.sortOrder === "asc" ? 1 : -1;

  return populateBugQuery(Bug.find(filter).sort({ [sortBy]: sortOrder }));
}

export async function getBugById(bugId, user) {
  if (!mongoose.Types.ObjectId.isValid(bugId)) {
    throw new ApiError(400, "Invalid bug id");
  }

  const bug = await populateBugQuery(Bug.findById(bugId));
  if (!bug) {
    throw new ApiError(404, "Bug not found");
  }

  const projectId = bug.project?._id || bug.project;
  await assertProjectAccess(projectId, user);

  return bug;
}

export async function updateBug(bugId, payload, user, io) {
  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new ApiError(404, "Bug not found");
  }

  const project = await assertProjectAccess(bug.project, user);
  const updates = { ...payload };

  if (updates.status !== undefined) {
    if (!hasRoleBugAction(user, BUG_ACTIONS.CHANGE_STATUS)) {
      throw new ApiError(403, "Forbidden: insufficient role to change status");
    }

    if (
      updates.status === "closed" &&
      !hasRoleBugAction(user, BUG_ACTIONS.CLOSE)
    ) {
      throw new ApiError(403, "Forbidden: only admins can close bugs");
    }
  }

  if (updates.assignees !== undefined) {
    if (!hasRoleBugAction(user, BUG_ACTIONS.ASSIGN)) {
      throw new ApiError(403, "Forbidden: insufficient role to assign bugs");
    }

    updates.assignees = await assertAssigneesAreProjectMembers(
      project,
      updates.assignees,
    );
  }

  const previousAssigneeIds = new Set(
    bug.assignees.map((assigneeId) => assigneeId.toString()),
  );
  const historyEntries = buildHistoryEntries(bug, updates, user.id);

  if (historyEntries.length > 0) {
    bug.history.push(...historyEntries);
  }

  await bug.save();

  const updatedBug = await populateBugQuery(Bug.findById(bug._id));

  io?.to(`project:${bug.project.toString()}`).emit("bug:updated", {
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    diff: historyEntries,
    bug: updatedBug,
  });

  io?.to(`project:${bug.project.toString()}`).emit("activity:new", {
    type: "bug:updated",
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    bugTitle: bug.title,
    actorId: user.id,
    diff: historyEntries,
    timestamp: new Date().toISOString(),
  });

  const nextAssigneeIds = updatedBug.assignees.map((assignee) =>
    assignee._id.toString(),
  );
  const newlyAssigned = nextAssigneeIds.filter(
    (assigneeId) => !previousAssigneeIds.has(assigneeId),
  );

  newlyAssigned.forEach((assigneeId) => {
    io?.to(`user:${assigneeId}`).emit("notification:new", {
      id: `${bug._id.toString()}-${assigneeId}-${Date.now()}`,
      type: "assignment",
      message: `You were assigned to bug: ${bug.title}`,
      bugId: bug._id.toString(),
      projectId: bug.project.toString(),
      createdAt: new Date().toISOString(),
    });
  });

  return updatedBug;
}

export async function removeBug(bugId, user, io) {
  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new ApiError(404, "Bug not found");
  }

  const project = await Project.findById(bug.project);

  if (!canDeleteBugByPolicy({ bug, project, user })) {
    throw new ApiError(
      403,
      "Forbidden: only admins, reporters, or project owner can delete",
    );
  }

  await bug.deleteOne();

  io?.to(`project:${bug.project.toString()}`).emit("activity:new", {
    type: "bug:deleted",
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    bugTitle: bug.title,
    actorId: user.id,
    timestamp: new Date().toISOString(),
  });

  return { deleted: true };
}

export async function addCommentToBug(bugId, text, user, io) {
  const bug = await Bug.findById(bugId);
  if (!bug) {
    throw new ApiError(404, "Bug not found");
  }

  await assertProjectAccess(bug.project, user);

  bug.comments.push({
    author: user.id,
    text,
  });

  bug.history.push({
    changedBy: user.id,
    field: "comment",
    oldValue: null,
    newValue: text,
    timestamp: new Date(),
  });

  await bug.save();

  const updatedBug = await populateBugQuery(Bug.findById(bug._id));
  const latestComment = updatedBug.comments[updatedBug.comments.length - 1];

  io?.to(`project:${bug.project.toString()}`).emit("activity:new", {
    type: "bug:commented",
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    bugTitle: bug.title,
    actorId: user.id,
    timestamp: new Date().toISOString(),
  });

  return {
    bug: updatedBug,
    comment: latestComment,
  };
}

export async function resolveBugFromWebhook({ bugId, commit }, io) {
  if (!mongoose.Types.ObjectId.isValid(bugId)) {
    return null;
  }

  const bug = await Bug.findById(bugId);
  if (!bug) {
    return null;
  }

  const previousStatus = bug.status;
  bug.status = "resolved";
  bug.resolvedAt = new Date();

  bug.history.push({
    changedBy: null,
    field: "status",
    oldValue: previousStatus,
    newValue: "resolved",
    timestamp: new Date(),
  });

  bug.githubLinks.push({
    sha: commit.id || "",
    commitUrl: commit.url || "",
    prUrl: "",
    message: commit.message || "",
  });

  await bug.save();

  io?.to(`project:${bug.project.toString()}`).emit("bug:updated", {
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    diff: [
      {
        field: "status",
        oldValue: previousStatus,
        newValue: "resolved",
        changedBy: null,
        timestamp: new Date(),
      },
    ],
  });

  io?.to(`project:${bug.project.toString()}`).emit("activity:new", {
    type: "bug:resolved_by_github",
    projectId: bug.project.toString(),
    bugId: bug._id.toString(),
    bugTitle: bug.title,
    commitSha: commit.id || "",
    timestamp: new Date().toISOString(),
  });

  return bug;
}
