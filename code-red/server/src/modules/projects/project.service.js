import mongoose from "mongoose";
import Project from "./project.model.js";
import { ApiError } from "../../utils/ApiError.js";
import User, { userRoles } from "../users/user.model.js";

const PROJECT_ACTIONS = {
  CREATE: "create_project",
  MANAGE: "manage_project",
  DELETE: "delete_project",
};

const PROJECT_ROLE_ACTION_MATRIX = {
  admin: [
    PROJECT_ACTIONS.CREATE,
    PROJECT_ACTIONS.MANAGE,
    PROJECT_ACTIONS.DELETE,
  ],
  developer: [PROJECT_ACTIONS.CREATE],
  reporter: [PROJECT_ACTIONS.CREATE],
};

const normalizeRole = (role) => (role === "tester" ? "reporter" : role);

const hasRoleProjectAction = (user, action) =>
  PROJECT_ROLE_ACTION_MATRIX[normalizeRole(user.role)]?.includes(action) ||
  false;

const isOwner = (project, userId) => project.owner.toString() === userId;

const isMember = (project, userId) =>
  project.members.some((member) => member.user.toString() === userId);

export const canManageProject = (project, user) =>
  hasRoleProjectAction(user, PROJECT_ACTIONS.MANAGE) ||
  isOwner(project, user.id);

export const canDeleteProject = (project, user) =>
  hasRoleProjectAction(user, PROJECT_ACTIONS.DELETE) ||
  isOwner(project, user.id);

const canCreateProject = (user) =>
  hasRoleProjectAction(user, PROJECT_ACTIONS.CREATE);

const normalizeMemberRole = (role) => {
  const normalizedRole = normalizeRole(String(role || "").trim());
  return userRoles.includes(normalizedRole) ? normalizedRole : "developer";
};

const resolveMemberUserId = async (rawUser) => {
  const token = String(rawUser || "").trim();
  if (!token) {
    throw new ApiError(400, "Project member user is required");
  }

  if (mongoose.Types.ObjectId.isValid(token)) {
    const existingUser = await User.exists({ _id: token });
    if (!existingUser) {
      throw new ApiError(400, `Project member not found: ${token}`);
    }

    return token;
  }

  const matchedUser = await User.findOne({
    email: token.toLowerCase(),
  })
    .select("_id")
    .lean();

  if (!matchedUser) {
    throw new ApiError(400, `Project member not found: ${token}`);
  }

  return matchedUser._id.toString();
};

const normalizeProjectMembers = async (membersInput) => {
  if (!Array.isArray(membersInput)) {
    return [];
  }

  const dedupedMembers = new Map();

  for (const entry of membersInput) {
    const rawUser = typeof entry === "string" ? entry : entry?.user;
    const rawRole = typeof entry === "string" ? "developer" : entry?.role;

    const resolvedUserId = await resolveMemberUserId(rawUser);
    const resolvedRole = normalizeMemberRole(rawRole);

    dedupedMembers.set(resolvedUserId, {
      user: resolvedUserId,
      role: resolvedRole,
    });
  }

  return [...dedupedMembers.values()];
};

const getMemberUserId = (member) =>
  String(member?.user?._id || member?.user?.id || member?.user || "").trim();

const ensureOwnerMembership = (members, ownerId, ownerRole = "developer") => {
  const normalizedOwnerId = String(ownerId || "").trim();

  if (!normalizedOwnerId) {
    return members;
  }

  const hasOwner = members.some(
    (member) => getMemberUserId(member) === normalizedOwnerId,
  );

  if (!hasOwner) {
    members.push({ user: normalizedOwnerId, role: normalizeMemberRole(ownerRole) });
  }

  return members;
};

export async function listProjects(user) {
  if (user.role === "admin") {
    return Project.find({})
      .populate("owner", "name email avatar")
      .populate("members.user", "name email role avatar");
  }

  return Project.find({
    $or: [{ owner: user.id }, { "members.user": user.id }],
  })
    .populate("owner", "name email avatar")
    .populate("members.user", "name email role avatar");
}

export async function createProject(payload, user) {
  if (!canCreateProject(user)) {
    throw new ApiError(403, "Forbidden: cannot create project");
  }

  const uniqueTags = [...new Set(payload.tags || [])];

  const members = await normalizeProjectMembers(payload.members || []);
  const ownerMember = {
    user: user.id,
    role: user.role === "admin" ? "admin" : "developer",
  };

  const normalizedMembers = ensureOwnerMembership(
    [...members],
    ownerMember.user,
    ownerMember.role,
  );

  const project = await Project.create({
    name: payload.name,
    description: payload.description,
    owner: user.id,
    members: normalizedMembers,
    tags: uniqueTags,
  });

  return Project.findById(project._id)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email role avatar");
}

export async function getProjectById(projectId, user) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new ApiError(400, "Invalid project id");
  }

  const project = await Project.findById(projectId)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email role avatar");

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (
    user.role !== "admin" &&
    !isOwner(project, user.id) &&
    !isMember(project, user.id)
  ) {
    throw new ApiError(403, "Forbidden: not a project member");
  }

  return project;
}

export async function updateProject(projectId, payload, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!canManageProject(project, user)) {
    throw new ApiError(403, "Forbidden: only owner/admin can update project");
  }

  if (payload.name !== undefined) {
    project.name = payload.name;
  }
  if (payload.description !== undefined) {
    project.description = payload.description;
  }
  if (payload.tags !== undefined) {
    project.tags = [...new Set(payload.tags || [])];
  }
  if (payload.members !== undefined) {
    project.members = ensureOwnerMembership(
      await normalizeProjectMembers(payload.members),
      project.owner,
    );
  }

  await project.save();

  return Project.findById(project._id)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email role avatar");
}

export async function removeProject(projectId, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!canDeleteProject(project, user)) {
    throw new ApiError(403, "Forbidden: only owner/admin can delete project");
  }

  await project.deleteOne();
  return { deleted: true };
}

export async function addMembersToProject(projectId, payload, user) {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  if (!canManageProject(project, user)) {
    throw new ApiError(403, "Forbidden: only owner/admin can add members");
  }

  const incomingMembers = await normalizeProjectMembers(payload.members || []);
  if (incomingMembers.length === 0) {
    throw new ApiError(400, "At least one member is required");
  }

  const memberMap = new Map();

  project.members.forEach((member) => {
    const memberId = getMemberUserId(member);
    if (memberId) {
      memberMap.set(memberId, {
        user: memberId,
        role: member.role || "developer",
      });
    }
  });

  // Incoming members are additive; existing roles are preserved.
  incomingMembers.forEach((member) => {
    const memberId = getMemberUserId(member);
    if (!memberId || memberMap.has(memberId)) {
      return;
    }

    memberMap.set(memberId, {
      user: memberId,
      role: member.role || "developer",
    });
  });

  project.members = ensureOwnerMembership(
    [...memberMap.values()],
    project.owner,
  );

  await project.save();

  return Project.findById(project._id)
    .populate("owner", "name email avatar")
    .populate("members.user", "name email role avatar");
}
