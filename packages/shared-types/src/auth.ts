import { z } from 'zod';
import { RoleCode } from './roles.js';

export const loginSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const verifyResetOtpSchema = z.object({
  email: z.string().email('Adresse e-mail invalide'),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Le code doit contenir exactement 6 chiffres'),
});

export type VerifyResetOtpInput = z.infer<typeof verifyResetOtpSchema>;

export const resetPasswordSchema = z
  .object({
    resetToken: z.string().min(1, 'Jeton de réinitialisation manquant'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string().min(8, 'Confirmez votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const authUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  roles: z.array(
    z.enum([
      RoleCode.ADMIN,
      RoleCode.PRESIDENT,
      RoleCode.SECRETARY,
      RoleCode.TREASURER,
      RoleCode.COMMISSION_LEAD,
      RoleCode.MEMBER,
    ]),
  ),
  isActive: z.boolean(),
});

export type AuthUser = z.infer<typeof authUserSchema>;

export const authTokensSchema = z.object({
  accessToken: z.string(),
  user: authUserSchema,
});

export type AuthTokens = z.infer<typeof authTokensSchema>;

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
