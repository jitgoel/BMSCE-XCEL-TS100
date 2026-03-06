import { io } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { pushActivity } from "../dashboard/activity.slice";
import { bugsApi } from "./bugs.api";

const resolveSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  if (import.meta.env.DEV) {
    return "http://localhost:5000";
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return "http://localhost:5000";
};

const SOCKET_URL = resolveSocketUrl();

export default function useBugSocket(projectId) {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      if (projectId) {
        socket.emit("project:join", projectId);
      }
    });

    socket.on("bug:updated", (payload) => {
      const incomingBug = payload?.bug;
      const bugId = payload?.bugId;
      const eventProjectId = payload?.projectId;

      if (incomingBug && bugId) {
        dispatch(
          bugsApi.util.updateQueryData("getBug", bugId, (draft) => {
            Object.assign(draft, incomingBug);
          }),
        );

        if (eventProjectId) {
          dispatch(
            bugsApi.util.updateQueryData(
              "getBugs",
              { project: eventProjectId },
              (draft) => {
                const index = draft.findIndex(
                  (item) => item._id === incomingBug._id,
                );
                if (index >= 0) {
                  draft[index] = incomingBug;
                } else {
                  draft.unshift(incomingBug);
                }
              },
            ),
          );
        }
      }

      dispatch(
        bugsApi.util.invalidateTags([
          { type: "Bug", id: bugId || "LIST" },
          { type: "Bug", id: "LIST" },
        ]),
      );
    });

    socket.on("activity:new", (activityPayload) => {
      dispatch(pushActivity(activityPayload));
    });

    return () => {
      if (projectId) {
        socket.emit("project:leave", projectId);
      }
      socket.disconnect();
    };
  }, [dispatch, projectId, token]);
}
