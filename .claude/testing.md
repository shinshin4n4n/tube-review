# Testing Standards

TubeReview プロジェクトのテスト規約とパターンを記載します。

## Testing Philosophy

1. **80%+ Coverage Required**: 全てのコードは80%以上のカバレッジが必須
2. **AAA Pattern**: Arrange-Act-Assert パターンに従う
3. **Real Scenarios**: 実際のユースケースをテスト
4. **Fast Feedback**: テストは高速に実行可能であること

## Unit Testing (Vitest)

### Setup

```bash
# ユニットテスト実行
npm run test:unit

# カバレッジ付き実行
npm run test:unit -- --coverage

# Watch mode
npm run test:unit -- --watch
```

### File Location

```
{対象ファイルのパス}/__tests__/{ファイル名}.test.ts
```

例:

```
app/_actions/review-actions.ts
app/_actions/__tests__/review-actions.test.ts
```

### Test Pattern Template

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createReview } from "../review-actions";

describe("createReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a review successfully", async () => {
    // Arrange
    const input = {
      channelId: "UC123",
      rating: 5,
      comment: "Great channel!",
    };

    // Act
    const result = await createReview(input);

    // Assert
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBeDefined();
      expect(result.data.rating).toBe(5);
    }
  });

  it("should return error when validation fails", async () => {
    // Arrange
    const input = {
      channelId: "",
      rating: 6, // invalid: max is 5
      comment: "",
    };

    // Act
    const result = await createReview(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("rating");
    }
  });

  it("should require authentication", async () => {
    // Arrange
    vi.mock("@/lib/auth", () => ({
      getUser: vi.fn().mockResolvedValue(null),
    }));

    const input = {
      channelId: "UC123",
      rating: 5,
      comment: "Test",
    };

    // Act
    const result = await createReview(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("ログイン");
    }
  });
});
```

### Testing Server Actions

```typescript
import { vi } from "vitest";

// Supabase モック
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { id: "1", rating: 5 },
            error: null,
          })),
        })),
      })),
    })),
  })),
}));

// Auth モック
vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(() => Promise.resolve({ id: "user123" })),
}));
```

### Testing React Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, it, describe, vi } from 'vitest';
import { ReviewForm } from '../ReviewForm';

describe('ReviewForm', () => {
  it('should render form elements', () => {
    render(<ReviewForm channelId="UC123" />);

    expect(screen.getByLabelText('評価')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const mockSubmit = vi.fn();
    render(<ReviewForm channelId="UC123" onSubmit={mockSubmit} />);

    const ratingInput = screen.getByLabelText('評価');
    fireEvent.change(ratingInput, { target: { value: '5' } });

    const submitButton = screen.getByRole('button', { name: '送信' });
    fireEvent.click(submitButton);

    expect(mockSubmit).toHaveBeenCalledWith({ rating: 5 });
  });
});
```

### Testing API Routes

```typescript
import { GET } from "../route";
import { NextRequest } from "next/server";

describe("GET /api/search", () => {
  it("should return search results", async () => {
    const request = new NextRequest("http://localhost/api/search?query=test");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeInstanceOf(Array);
  });

  it("should return 400 when query is missing", async () => {
    const request = new NextRequest("http://localhost/api/search");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});
```

## E2E Testing (Playwright)

### Setup

```bash
# E2Eテスト実行
npm run test:e2e

# UI mode
npm run test:e2e -- --ui

# Debug mode
npm run test:e2e -- --debug
```

### File Location

```
tests/e2e/{feature}.spec.ts
```

### E2E Pattern Template

```typescript
import { test, expect } from "@playwright/test";

test.describe("Review Submission", () => {
  test.beforeEach(async ({ page }) => {
    // 認証状態のセットアップ
    await page.goto("/login");
    // ... ログイン処理 ...
  });

  test("should submit a review", async ({ page }) => {
    // Navigate
    await page.goto("/channels/UC123");

    // Fill form
    await page.getByLabel("評価").fill("5");
    await page.getByLabel("コメント").fill("Great channel!");

    // Submit
    await page.getByRole("button", { name: "送信" }).click();

    // Verify
    await expect(page.getByText("レビューを投稿しました")).toBeVisible();
    await expect(page.getByText("Great channel!")).toBeVisible();
  });

  test("should show validation error", async ({ page }) => {
    await page.goto("/channels/UC123");

    // Submit without filling
    await page.getByRole("button", { name: "送信" }).click();

    // Verify error
    await expect(page.getByText("評価は必須です")).toBeVisible();
  });
});
```

### Common E2E Patterns

#### 認証テスト

```typescript
test("should require authentication", async ({ page }) => {
  await page.goto("/reviews/new");

  // Redirect to login
  await expect(page).toHaveURL(/.*login/);
});
```

#### フォームテスト

```typescript
test("should handle form submission", async ({ page }) => {
  await page.goto("/reviews/new");

  await page.fill('[name="rating"]', "5");
  await page.fill('[name="comment"]', "Test comment");
  await page.click('button[type="submit"]');

  await expect(page.getByText("Success")).toBeVisible();
});
```

#### マルチデバイステスト

```typescript
test.describe("Responsive Design", () => {
  test("should work on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    await expect(page.getByRole("button", { name: "メニュー" })).toBeVisible();
  });

  test("should work on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/");

    await expect(page.getByRole("navigation")).toBeVisible();
  });
});
```

## Coverage Requirements

- **Statements**: 80%以上
- **Branches**: 75%以上
- **Functions**: 80%以上
- **Lines**: 80%以上

## CI Integration

### GitHub Actions Workflow

```yaml
- name: Run unit tests
  run: npm run test:unit -- --coverage

- name: Run E2E tests
  run: npm run test:e2e
```

### Pre-commit Hooks

```json
{
  "pre-commit": "npm run test:unit"
}
```

## Mocking Guidelines

### Mock External APIs

```typescript
// YouTube API モック
vi.mock("@/lib/youtube/api", () => ({
  searchChannels: vi.fn(() =>
    Promise.resolve([{ id: "UC123", title: "Test Channel" }])
  ),
}));
```

### Mock Supabase

```typescript
// Supabase Client モック
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: mockData,
        error: null,
      })),
    })),
  })),
}));
```

### Mock Authentication

```typescript
// Auth モック
vi.mock("@/lib/auth", () => ({
  getUser: vi.fn(() =>
    Promise.resolve({
      id: "user123",
      email: "test@example.com",
    })
  ),
  requireAuth: vi.fn(() =>
    Promise.resolve({
      id: "user123",
      email: "test@example.com",
    })
  ),
}));
```

## Best Practices

1. **テストは動作をテスト**（実装詳細ではない）
   - ❌ `expect(component.state.isOpen).toBe(true)`
   - ✅ `expect(screen.getByRole('dialog')).toBeVisible()`

2. **テストは独立して実行可能**
   - 各テストは他のテストに依存しない
   - `beforeEach` でクリーンな状態を準備

3. **明確なアサーション**
   - テストごとに1つの主要なアサーション
   - 失敗時にエラー箇所が明確

4. **意味のあるテスト名**
   - ❌ `it('test 1')`
   - ✅ `it('should return error when user is not authenticated')`

5. **エッジケースのテスト**
   - 正常系だけでなく異常系もテスト
   - 境界値テスト

6. **高速なテスト**
   - ユニットテストは1秒以内
   - E2Eテストは必要最小限

7. **テストのメンテナンス**
   - 壊れたテストは即座に修正
   - 不要なテストは削除

---

**Last Updated:** 2026-02-17
**Next Review:** 2026-08-17
**Update Triggers:**

- テストツール更新（Vitest, Playwright）
- カバレッジ要件変更
- 新しいテストパターン追加
