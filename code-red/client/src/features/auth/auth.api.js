import { baseApi } from "../../app/api/baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (payload) => ({
        url: "/auth/register",
        method: "post",
        data: payload,
      }),
      invalidatesTags: ["Auth"],
    }),
    login: builder.mutation({
      query: (payload) => ({
        url: "/auth/login",
        method: "post",
        data: payload,
      }),
      invalidatesTags: ["Auth"],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: "/auth/refresh",
        method: "post",
      }),
    }),
    me: builder.query({
      query: () => ({
        url: "/auth/me",
        method: "get",
      }),
      providesTags: ["Auth"],
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "post",
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useRefreshTokenMutation,
  useMeQuery,
  useLazyMeQuery,
  useLogoutMutation,
} = authApi;

export const useRefreshMutation = useRefreshTokenMutation;
