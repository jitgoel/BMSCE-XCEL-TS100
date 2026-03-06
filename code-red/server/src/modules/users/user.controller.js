import User, { userRoles } from "./user.model.js";
import { ApiError } from "../../utils/ApiError.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const assignableRoles = userRoles.filter((role) => role !== "tester");

export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!assignableRoles.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  user.role = role;
  await user.save();

  res.status(200).json({
    message: "User role updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt,
    },
  });
});
