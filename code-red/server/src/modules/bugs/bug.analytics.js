import mongoose from "mongoose";
import { ApiError } from "../../utils/ApiError.js";
import { assertProjectAccess } from "./bug.service.js";
import Bug from "./bug.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDateRange = (days = 30) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date(end.getTime() - (days - 1) * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const dates = [];
  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = new Date(cursor.getTime() + DAY_MS)
  ) {
    dates.push(cursor.toISOString().slice(0, 10));
  }

  return { start, end, dates };
};

const toObjectCounts = (rows, defaults) => {
  const output = { ...defaults };
  rows.forEach((row) => {
    output[row._id] = row.count;
  });
  return output;
};

export async function getProjectAnalytics(projectId, user) {
  if (!user) {
    throw new ApiError(401, "Unauthorized");
  }

  await assertProjectAccess(projectId, user);

  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const { start, dates } = buildDateRange(30);

  const [statusRows, priorityRows, resolutionRows, openedRows, closedRows] =
    await Promise.all([
      Bug.aggregate([
        { $match: { project: projectObjectId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        { $match: { project: projectObjectId } },
        { $group: { _id: "$priority", count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        {
          $match: {
            project: projectObjectId,
            status: { $in: ["resolved", "closed"] },
            resolvedAt: { $ne: null },
          },
        },
        {
          $project: {
            resolutionMs: { $subtract: ["$resolvedAt", "$createdAt"] },
          },
        },
        {
          $group: {
            _id: null,
            averageMs: { $avg: "$resolutionMs" },
          },
        },
      ]),
      Bug.aggregate([
        {
          $match: {
            project: projectObjectId,
            createdAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: { $dateToString: { date: "$createdAt", format: "%Y-%m-%d" } },
            count: { $sum: 1 },
          },
        },
      ]),
      Bug.aggregate([
        {
          $match: {
            project: projectObjectId,
            resolvedAt: { $gte: start },
          },
        },
        {
          $group: {
            _id: { $dateToString: { date: "$resolvedAt", format: "%Y-%m-%d" } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

  const statusByProject = toObjectCounts(statusRows, {
    open: 0,
    "in-progress": 0,
    resolved: 0,
    closed: 0,
  });

  const priorityCounts = toObjectCounts(priorityRows, {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  const avgResolutionMs = resolutionRows[0]?.averageMs || 0;
  const avgResolutionHours = Number(
    (avgResolutionMs / (1000 * 60 * 60)).toFixed(2),
  );

  const openedMap = new Map(openedRows.map((row) => [row._id, row.count]));
  const closedMap = new Map(closedRows.map((row) => [row._id, row.count]));

  const trend = dates.map((date) => ({
    date,
    opened: openedMap.get(date) || 0,
    closed: closedMap.get(date) || 0,
  }));

  return {
    statusByProject,
    priorityCounts,
    avgResolutionHours,
    trend,
  };
}
