import { baseApi } from "../../app/api/baseApi";

export const bugsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getBugs: builder.query({
      query: (filters = {}) => ({
        url: "/bugs",
        method: "get",
        params: filters,
      }),
      transformResponse: (response) => response.bugs || [],
      providesTags: (result) =>
        result
          ? [
              ...result.map((bug) => ({ type: "Bug", id: bug._id })),
              { type: "Bug", id: "LIST" },
            ]
          : [{ type: "Bug", id: "LIST" }],
    }),
    getBug: builder.query({
      query: (bugId) => ({
        url: `/bugs/${bugId}`,
        method: "get",
      }),
      transformResponse: (response) => response.bug,
      providesTags: (result, error, bugId) => [{ type: "Bug", id: bugId }],
    }),
    createBug: builder.mutation({
      query: (payload) => ({
        url: "/bugs",
        method: "post",
        data: payload,
      }),
      invalidatesTags: [{ type: "Bug", id: "LIST" }],
    }),
    checkBugDuplicates: builder.mutation({
      query: (payload) => ({
        url: "/bugs/preflight/duplicates",
        method: "post",
        data: payload,
      }),
    }),
    updateBug: builder.mutation({
      query: ({ bugId, payload }) => ({
        url: `/bugs/${bugId}`,
        method: "put",
        data: payload,
      }),
      transformResponse: (response) => response.bug,
      invalidatesTags: (result, error, { bugId }) => [
        { type: "Bug", id: bugId },
        { type: "Bug", id: "LIST" },
      ],
    }),
    deleteBug: builder.mutation({
      query: (bugId) => ({
        url: `/bugs/${bugId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Bug", id: "LIST" }],
    }),
    addBugComment: builder.mutation({
      query: ({ bugId, text }) => ({
        url: `/bugs/${bugId}/comments`,
        method: "post",
        data: { text },
      }),
      transformResponse: (response) => response,
      invalidatesTags: (result, error, { bugId }) => [
        { type: "Bug", id: bugId },
      ],
    }),
  }),
});

export const {
  useGetBugsQuery,
  useGetBugQuery,
  useCreateBugMutation,
  useCheckBugDuplicatesMutation,
  useUpdateBugMutation,
  useDeleteBugMutation,
  useAddBugCommentMutation,
} = bugsApi;
