import { useSelector } from "react-redux";
import { useCallback } from "react";

const rolePermissionMap = {
  admin: [
    "create_bug",
    "create_project",
    "delete_bug",
    "close_bug",
    "manage_members",
    "change_status",
    "assign_bug",
    "manage_project",
    "delete_project",
  ],
  developer: [
    "create_bug",
    "create_project",
    "change_status",
    "assign_bug",
    "delete_bug",
  ],
  reporter: ["create_bug", "create_project", "change_status", "assign_bug"],
};

const normalizeRole = (role) => (role === "tester" ? "reporter" : role);

const normalizeId = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  const candidateId = value._id || value.id || value;
  return String(candidateId || "").trim();
};

const getProjectOwnerId = (project) =>
  normalizeId(project?.owner?._id || project?.owner?.id || project?.owner);

const getBugReporterId = (bug) =>
  normalizeId(bug?.reporter?._id || bug?.reporter?.id || bug?.reporter);

export default function usePermission(permission, context = {}) {
  const user = useSelector((state) => state.auth.user || null);
  const role = normalizeRole(user?.role || "reporter");
  const userId = normalizeId(user?.id || user?._id);

  const checkPermission = useCallback(
    (requestedPermission, requestedContext = {}) => {
      if (!requestedPermission) {
        return false;
      }

      const directRolePermissions = rolePermissionMap[role] || [];
      if (directRolePermissions.includes(requestedPermission)) {
        return true;
      }

      const projectContext =
        requestedContext.project || requestedContext.bug?.project;
      const projectOwnerId = getProjectOwnerId(projectContext);

      if (
        ["manage_project", "delete_project"].includes(requestedPermission) &&
        projectOwnerId &&
        projectOwnerId === userId
      ) {
        return true;
      }

      if (requestedPermission === "delete_bug") {
        const bugReporterId = getBugReporterId(requestedContext.bug);
        if (bugReporterId && bugReporterId === userId) {
          return true;
        }

        if (projectOwnerId && projectOwnerId === userId) {
          return true;
        }
      }

      return false;
    },
    [role, userId],
  );

  if (typeof permission === "string") {
    return checkPermission(permission, context);
  }

  return checkPermission;
}
