import type { User } from "@supabase/supabase-js";

/**
 * Create a mock User object for testing
 * @param overrides - Partial User properties to override defaults
 * @returns Complete User object with all required properties
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();

  return {
    id: "user-123",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: now,
    ...overrides,
  };
}
