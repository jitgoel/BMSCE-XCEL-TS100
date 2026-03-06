import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addMembersToProject,
  createProject,
  getProjectById,
  listProjects,
  removeProject,
  updateProject,
} from "./project.service.js";

export const getProjects = asyncHandler(async (req, res) => {
  const projects = await listProjects(req.user);
  res.status(200).json({ projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id, req.user);
  res.status(200).json({ project });
});

export const postProject = asyncHandler(async (req, res) => {
  const project = await createProject(req.body, req.user);
  res.status(201).json({ project });
});

export const putProject = asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.body, req.user);
  res.status(200).json({ project });
});

export const postProjectMembers = asyncHandler(async (req, res) => {
  const project = await addMembersToProject(req.params.id, req.body, req.user);
  res.status(200).json({ project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  const result = await removeProject(req.params.id, req.user);
  res.status(200).json(result);
});
