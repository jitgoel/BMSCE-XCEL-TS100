import { createApi } from "@reduxjs/toolkit/query/react";
import apiClient from "../../services/axios.instance";

const axiosBaseQuery =
  () =>
  async ({ url, method = "get", data, params }) => {
    try {
      const result = await apiClient({
        url,
        method,
        data,
        params,
      });

      return { data: result.data };
    } catch (axiosError) {
      return {
        error: {
          status: axiosError.response?.status || 500,
          data: axiosError.response?.data || { message: axiosError.message },
        },
      };
    }
  };

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Auth", "Project", "Bug", "Analytics"],
  endpoints: () => ({}),
});
