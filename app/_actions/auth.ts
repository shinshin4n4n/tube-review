'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@/lib/types/api';
import { signUpSchema, signInSchema } from '@/lib/validation/auth';

/**
 * メールアドレスとパスワードでサインアップ
 */
export async function signUp(
  email: string,
  password: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    // バリデーション
    const validated = signUpSchema.parse({ email, password });

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email: validated.email,
      password: validated.password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      data: {
        message: 'Check your email to confirm your account',
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || 'Validation error',
      };
    }

    console.error('Sign up error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * メールアドレスとパスワードでサインイン
 */
export async function signIn(
  email: string,
  password: string
): Promise<ApiResponse<{ message: string }>> {
  try {
    // バリデーション
    const validated = signInSchema.parse({ email, password });

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    revalidatePath('/', 'layout');

    return {
      success: true,
      data: {
        message: 'Signed in successfully',
      },
    };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return {
        success: false,
        error: err.issues[0]?.message || 'Validation error',
      };
    }

    console.error('Sign in error:', err);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * ログアウト
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/**
 * ログアウト（エイリアス）
 */
export const signOutAction = signOut;
