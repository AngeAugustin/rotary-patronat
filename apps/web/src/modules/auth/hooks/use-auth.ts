import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AuthUser,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
  VerifyResetOtpInput,
} from '@rotary/shared-types';
import {
  forgotPassword,
  login,
  logout,
  fetchCurrentUser,
  resetPassword,
  verifyResetOtp,
  authQueryKeys,
} from '../api';
import { getAccessToken } from '@/lib/api-client';
import { connectRealtime, disconnectRealtime } from '@/lib/realtime-client';
import { useAuthSession } from '../context/AuthSessionProvider';

export function useCurrentUser() {
  const { isAuthReady, isAuthenticated } = useAuthSession();

  return useQuery<AuthUser>({
    queryKey: authQueryKeys.auth.me,
    queryFn: fetchCurrentUser,
    enabled: isAuthReady && isAuthenticated && Boolean(getAccessToken()),
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const { setAuthenticated } = useAuthSession();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (data) => {
      queryClient.setQueryData<AuthUser>(authQueryKeys.auth.me, data.user);
      setAuthenticated(true);
      connectRealtime();
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: ForgotPasswordInput) => forgotPassword(input),
  });
}

export function useVerifyResetOtp() {
  return useMutation({
    mutationFn: (input: VerifyResetOtpInput) => verifyResetOtp(input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(input),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const { setAuthenticated } = useAuthSession();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      disconnectRealtime();
      setAuthenticated(false);
      queryClient.removeQueries({ queryKey: authQueryKeys.auth.me });
    },
  });
}
