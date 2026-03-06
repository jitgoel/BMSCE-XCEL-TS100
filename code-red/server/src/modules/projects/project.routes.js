import { Router } from "express";
import { body, param } from "express-validator";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import {
  deleteProject,
  getProject,
  getProjects,
  postProjectMembers,
  postProject,
  putProject,
} from "./project.controller.js";

const router = Router();

router.use(protect);

router.get("/", getProjects);

router.get(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid project id")],
  validateRequest,
  getProject,
);

router.post(
  "/",
  [body("name").trim().notEmpty().withMessage("Project name is required")],
  validateRequest,
  postProject,
);

router.put(
  "/:id",
  [
    param("id").isMongoId().withMessage("Invalid project id"),
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
  ],
  validateRequest,
  putProject,
);

router.post(
  "/:id/members",
  [
    param("id").isMongoId().withMessage("Invalid project id"),
    body("members")
      .isArray({ min: 1 })
      .withMessage("Members are required"),
    body("members.*").custom((value) => {
      if (typeof value === "string") {
        if (!value.trim()) {
          throw new Error("Each member must be a non-empty user id or email");
        }
        return true;
      }

      if (value && typeof value === "object" && typeof value.user === "string") {
        if (!value.user.trim()) {
          throw new Error("Each member must include a non-empty user value");
        }
        return true;
      }

      throw new Error("Each member must be a user id/email string or object");
    }),
  ],
  validateRequest,
  postProjectMembers,
);

router.delete(
  "/:id",
  [param("id").isMongoId().withMessage("Invalid project id")],
  validateRequest,
  deleteProject,
);

export default router;
