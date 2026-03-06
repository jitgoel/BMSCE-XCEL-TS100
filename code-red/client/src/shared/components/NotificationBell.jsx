import { Bell } from "lucide-react";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "../../features/notifications/notification.slice";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector((state) => state.notifications.items);
  const unreadCount = useSelector((state) => state.notifications.unreadCount);

  const openNotification = (notification) => {
    dispatch(markNotificationRead(notification.id));
    if (notification.bugId) {
      navigate(`/bugs/${notification.bugId}`);
      setOpen(false);
    }
  };

  return (
    <div className="notification-wrapper">
      <button
        type="button"
        className="bell-button"
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="notification-count">{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notification-panel">
          <div className="notification-panel-header">
            <strong>Notifications</strong>
            <button
              type="button"
              className="ghost-button"
              onClick={() => dispatch(markAllNotificationsRead())}
            >
              Mark all read
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="subtle-copy">No notifications yet.</p>
          ) : (
            <ul className="notification-list">
              {notifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notification-item ${item.read ? "is-read" : ""}`}
                    onClick={() => openNotification(item)}
                  >
                    <span>{item.message}</span>
                    <small>
                      {new Date(item.createdAt || Date.now()).toLocaleString()}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
