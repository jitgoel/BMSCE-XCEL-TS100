import { baseApi } from "../../app/api/baseApi";

export const dashboardApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjectAnalytics: builder.query({
      query: (projectId) => ({
        url: `/analytics/project/${projectId}`,
        method: "get",
      }),
      transformResponse: (response) => response.analytics,
      providesTags: (result, error, projectId) => [
        { type: "Analytics", id: projectId },
      ],
    }),
  }),
});

export const { useGetProjectAnalyticsQuery } = dashboardApi;
