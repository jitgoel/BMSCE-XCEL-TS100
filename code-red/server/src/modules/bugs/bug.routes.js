import { Router } from "express";
import { body, param, query } from "express-validator";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { bugPriority, bugSeverity, bugStatus } from "./bug.model.js";
import {
  deleteBug,
  getBug,
  listBugs,
  postBugPreflightDuplicates,
  postBug,
  postComment,
  putBug,
} from "./bug.controller.js";

const router = Router();

router.use(protect);

router.post(
  "/preflight/duplicates",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("project").isMongoId().withMessage("Valid project is required"),
  ],
  validateRequest,
  postBugPreflightDuplicates,
);

router.post(
  "/",
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("project").isMongoId().withMessage("Valid project is required"),
    body("status").optional().isIn(bugStatus).withMessage("Invalid status"),
    body("priority")
      .optional()
      .isIn(bugPriority)
      .withMessage("Invalid priority"),
    body("severity")
      .optional()
      .isIn(bugSeverity)
      .withMessage("Invalid severity"),
    body("assignees")
      .optional()
      .isArray()
      .withMessage("Assignees must be an array"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("attachments")
      .optional()
      .isArray()
      .withMessage("Attachments must be an array"),
  ],
  validateRequest,
  postBug,
);

router.get(
  "/",
  [
    query("project").optional().isMongoId().withMessage("Invalid project id"),
    query("assignee").optional().isMongoId().withMessage("Invalid assignee id"),
  ],
  validateRequest,
  listBugs,
);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid bug id")],
  validateRequest,
  getBug,
);

router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid bug id"),
    body("status").optional().isIn(bugStatus).withMessage("Invalid status"),
    body("priority")
      .optional()
      .isIn(bugPriority)
      .withMessage("Invalid priority"),
    body("severity")
      .optional()
      .isIn(bugSeverity)
      .withMessage("Invalid severity"),
    body("assignees")
      .optional()
      .isArray()
      .withMessage("Assignees must be an array"),
    body("tags").optional().isArray().withMessage("Tags must be an array"),
    body("attachments")
      .optional()
      .isArray()
      .withMessage("Attachments must be an array"),
  ],
  validateRequest,
  putBug,
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid bug id")],
  validateRequest,
  deleteBug,
);

router.post(
  "/:id/comments",
  [
    param("id").isMongoId().withMessage("Invalid bug id"),
    body("text").trim().notEmpty().withMessage("Comment text is required"),
  ],
  validateRequest,
  postComment,
);

export default router;
