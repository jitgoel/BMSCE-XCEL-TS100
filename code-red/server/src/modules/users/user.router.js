import { Router } from "express";
import { body, param } from "express-validator";
import { protect, authorize } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { userRoles } from "./user.model.js";
import { updateUserRole } from "./user.controller.js";

const router = Router();
const assignableRoles = userRoles.filter((role) => role !== "tester");

router.use(protect, authorize("admin"));

router.put(
  "/:id/role",
  [
    param("id").isMongoId().withMessage("Invalid user id"),
    body("role").isIn(assignableRoles).withMessage("Invalid role"),
  ],
  validateRequest,
  updateUserRole,
);

export default router;
