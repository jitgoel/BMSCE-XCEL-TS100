import { io } from "socket.io-client";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { receiveNotification } from "./notification.slice";

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

export default function useNotificationSocket() {
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

    socket.on("notification:new", (notificationPayload) => {
      dispatch(receiveNotification(notificationPayload));
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, token]);
}
