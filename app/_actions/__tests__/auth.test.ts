import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signUp, signIn, signOut } from '../auth';

// Supabase client mock
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
  },
};

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully sign up with valid email and password', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: '123', email } },
      error: null,
    });

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(true);
    expect(result.data?.message).toContain('Check your email');
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email,
      password,
      options: {
        emailRedirectTo: expect.stringContaining('/auth/callback'),
      },
    });
  });

  it('should reject invalid email address', async () => {
    // Arrange
    const email = 'invalid-email';
    const password = 'password123';

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject password shorter than 8 characters', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'short';

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 8 characters');
  });

  it('should reject empty email field', async () => {
    // Arrange
    const email = '';
    const password = 'password123';

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should reject empty password field', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = '';

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should handle already registered email error', async () => {
    // Arrange
    const email = 'existing@example.com';
    const password = 'password123';
    mockSupabase.auth.signUp.mockResolvedValue({
      data: null,
      error: { message: 'User already registered' },
    });

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('User already registered');
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    const email = 'test@example.com';
    const password = 'password123';
    mockSupabase.auth.signUp.mockRejectedValue(new Error('Network error'));

    // Act
    const result = await signUp(email, password);

    // Assert
    expect(result.success).toBe(false);
    expect(result.error).toBe('An unexpected error occurred');
  });
});
