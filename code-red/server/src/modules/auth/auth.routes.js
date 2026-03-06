import { Router } from "express";
import { body } from "express-validator";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { login, logout, me, refresh, register } from "./auth.controller.js";

const router = Router();
const publicRegistrationRoles = ["reporter", "developer"];

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars"),
    body("role")
      .optional()
      .isIn(publicRegistrationRoles)
      .withMessage("Invalid role for registration"),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validateRequest,
  login,
);

router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", protect, me);

export default router;
