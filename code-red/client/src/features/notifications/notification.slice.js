import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    unreadCount: 0,
  },
  reducers: {
    receiveNotification: (state, action) => {
      state.items.unshift({
        ...action.payload,
        read: false,
      });
      state.unreadCount += 1;
      state.items = state.items.slice(0, 50);
    },
    markAllNotificationsRead: (state) => {
      state.items = state.items.map((item) => ({ ...item, read: true }));
      state.unreadCount = 0;
    },
    markNotificationRead: (state, action) => {
      const target = state.items.find((item) => item.id === action.payload);
      if (target && !target.read) {
        target.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
  },
});

export const {
  receiveNotification,
  markAllNotificationsRead,
  markNotificationRead,
} = notificationSlice.actions;
export default notificationSlice.reducer;
