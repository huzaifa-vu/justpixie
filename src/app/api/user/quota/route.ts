import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const today = new Date().toISOString().split('T')[0];
    let used = 0;
    let limit = 100;
    let isUnlimited = false;

    if (user) {
      // FORCE FETCH FRESH METADATA FROM AUTH SERVER (ADMIN CLIENT)
      const adminSupabase = createAdminClient();
      const { data: { user: freshUser }, error: fetchErr } = await adminSupabase.auth.admin.getUserById(user.id);
      
      if (fetchErr) throw fetchErr;

      const metadata = freshUser?.user_metadata || {};
      isUnlimited = metadata.tier === 'unlimited';
      
      // Check if usage is for today
      if (metadata.last_prompt_date === today) {
        used = metadata.prompts_used || 0;
      } else {
        used = 0;
      }
    } else {
      // GUEST LOGIC
      limit = 3;
      const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
      const adminSupabase = createAdminClient();
      const { data: usage } = await adminSupabase.from("guest_usage").select("*").eq("ip", ip).single();
      
      if (usage && usage.last_date === today) {
        used = usage.count;
      }
    }

    return NextResponse.json({
      used,
      limit,
      remaining: Math.max(0, limit - used),
      isUnlimited
    });
  } catch (err: any) {
    console.error("Quota Fetch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
