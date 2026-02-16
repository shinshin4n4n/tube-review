import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabase/route-handler";
import { magicLinkSchema } from "@/lib/validations/auth";
import { handleApiError } from "@/lib/api/error";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    logger.debug("Magic Link request started");
    const body = await request.json();
    logger.debug("Request body parsed");

    // バリデーション
    const result = magicLinkSchema.safeParse(body);
    if (!result.success) {
      logger.warn("Magic Link validation failed", {
        issues: result.error.issues,
      });
      return NextResponse.json(
        {
          error:
            result.error.issues[0]?.message || "入力内容を確認してください",
        },
        { status: 400 }
      );
    }

    const { email } = result.data;

    const supabase = await createRouteHandlerClient();

    // Magic Link送信
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
      },
    });

    if (error) {
      logger.error("Magic Link送信エラー", error, {
        status: error.status,
        code: "code" in error ? error.code : undefined,
      });

      // レート制限エラーは429、その他は500を返す
      return NextResponse.json(handleApiError(error), {
        status: error.message.includes("rate limit") ? 429 : 500,
      });
    }

    logger.info("Magic Link sent successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error(
      "Magic Link unexpected error",
      error instanceof Error ? error : new Error(String(error))
    );

    return NextResponse.json(handleApiError(error), { status: 500 });
  }
}
