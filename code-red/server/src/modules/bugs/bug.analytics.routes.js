import { Router } from "express";
import { param } from "express-validator";
import { protect } from "../../middlewares/auth.middleware.js";
import { validateRequest } from "../../middlewares/validate.middleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { getProjectAnalytics } from "./bug.analytics.js";

const router = Router();

router.get(
  "/project/:id",
  protect,
  [param("id").isMongoId().withMessage("Invalid project id")],
  validateRequest,
  asyncHandler(async (req, res) => {
    const analytics = await getProjectAnalytics(req.params.id, req.user);
    res.status(200).json({ analytics });
  }),
);

export default router;
