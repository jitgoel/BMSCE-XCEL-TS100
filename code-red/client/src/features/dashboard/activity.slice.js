import { createSlice } from "@reduxjs/toolkit";

const activitySlice = createSlice({
  name: "activity",
  initialState: {
    items: [],
  },
  reducers: {
    pushActivity: (state, action) => {
      state.items.unshift(action.payload);
      state.items = state.items.slice(0, 100);
    },
    resetActivity: (state) => {
      state.items = [];
    },
  },
});

export const { pushActivity, resetActivity } = activitySlice.actions;
export default activitySlice.reducer;
