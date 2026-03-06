import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  addCommentToBug,
  createBug,
  getBugById,
  getBugs,
  preflightDuplicateCheck,
  removeBug,
  updateBug,
} from "./bug.service.js";

export const postBugPreflightDuplicates = asyncHandler(async (req, res) => {
  const result = await preflightDuplicateCheck(req.body, req.user);
  res.status(200).json(result);
});

export const postBug = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await createBug(req.body, req.user, io);
  res.status(201).json(result);
});

export const listBugs = asyncHandler(async (req, res) => {
  const bugs = await getBugs(req.query, req.user);
  res.status(200).json({ bugs });
});

export const getBug = asyncHandler(async (req, res) => {
  const bug = await getBugById(req.params.id, req.user);
  res.status(200).json({ bug });
});

export const putBug = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const bug = await updateBug(req.params.id, req.body, req.user, io);
  res.status(200).json({ bug });
});

export const deleteBug = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await removeBug(req.params.id, req.user, io);
  res.status(200).json(result);
});

export const postComment = asyncHandler(async (req, res) => {
  const io = req.app.get("io");
  const result = await addCommentToBug(
    req.params.id,
    req.body.text,
    req.user,
    io,
  );
  res.status(201).json(result);
});
