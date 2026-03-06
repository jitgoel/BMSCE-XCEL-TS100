import { combineReducers } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import authReducer from "../features/auth/auth.slice";
import notificationsReducer from "../features/notifications/notification.slice";
import activityReducer from "../features/dashboard/activity.slice";

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  notifications: notificationsReducer,
  activity: activityReducer,
});

export default rootReducer;
