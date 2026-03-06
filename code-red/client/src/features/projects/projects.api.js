import { baseApi } from "../../app/api/baseApi";

export const projectsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: () => ({
        url: "/projects",
        method: "get",
      }),
      providesTags: (result) =>
        result?.projects
          ? [
              ...result.projects.map((project) => ({
                type: "Project",
                id: project._id,
              })),
              { type: "Project", id: "LIST" },
            ]
          : [{ type: "Project", id: "LIST" }],
    }),
    getProject: builder.query({
      query: (projectId) => ({
        url: `/projects/${projectId}`,
        method: "get",
      }),
      providesTags: (result, error, projectId) => [
        { type: "Project", id: projectId },
      ],
    }),
    createProject: builder.mutation({
      query: (payload) => ({
        url: "/projects",
        method: "post",
        data: payload,
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
    updateProject: builder.mutation({
      query: ({ projectId, payload }) => ({
        url: `/projects/${projectId}`,
        method: "put",
        data: payload,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),
    addProjectMembers: builder.mutation({
      query: ({ projectId, members }) => ({
        url: `/projects/${projectId}/members`,
        method: "post",
        data: { members },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Project", id: projectId },
        { type: "Project", id: "LIST" },
      ],
    }),
    deleteProject: builder.mutation({
      query: (projectId) => ({
        url: `/projects/${projectId}`,
        method: "delete",
      }),
      invalidatesTags: [{ type: "Project", id: "LIST" }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useAddProjectMembersMutation,
  useDeleteProjectMutation,
} = projectsApi;
