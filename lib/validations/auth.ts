import { z } from "zod";

/**
 * サインアップバリデーションスキーマ
 */
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * サインインバリデーションスキーマ
 */
export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Magic Linkバリデーションスキーマ
 */
export const magicLinkSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
