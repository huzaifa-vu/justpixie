import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Extract voter's IP address
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 2. Fetch all feature requests
    const { data: suggestions, error: fetchErr } = await supabase
      .from("feature_requests")
      .select("*")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchErr) {
      throw fetchErr;
    }

    // 3. Fetch all wishes upvoted by the current client IP address
    const { data: voteData, error: voteErr } = await supabase
      .from("feature_votes")
      .select("feature_id")
      .eq("ip_address", ip);

    if (voteErr) {
      console.error("Failed to query IP votes database:", voteErr);
    }

    const votedIds = voteData ? voteData.map((v: any) => v.feature_id) : [];

    return NextResponse.json({
      suggestions: suggestions || [],
      votedIds
    });
  } catch (err: any) {
    console.error("Fetch features error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to fetch feature requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, category, description } = await req.json();

    // Basic server-side sanitization and validation
    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }
    if (!category || typeof category !== "string" || !category.trim()) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }
    if (!description || typeof description !== "string" || !description.trim()) {
      return NextResponse.json({ error: "Description is required" }, { status: 400 });
    }

    // Extract client's IP address
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Limit long input hacks
    const cleanTitle = title.trim().slice(0, 100);
    const cleanCategory = category.trim().slice(0, 50);
    const cleanDescription = description.trim().slice(0, 500);

    const supabase = await createClient();

    // 1. Fetch user to check authorization status
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr) {
      console.error("Auth status query failed, treating as guest:", authErr);
    }

    // 2. Compute the start of today in UTC
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    // 3. Enforce submission rate quotas
    if (user) {
      // Registered User Quota Check: 10 wishes per day
      const { count, error: countErr } = await supabase
        .from("feature_requests")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfToday.toISOString());

      if (countErr) throw countErr;

      if (count && count >= 10) {
        return NextResponse.json(
          { error: "Daily quota limit reached. Registered creators are limited to 10 feature wishes per day!" },
          { status: 429 }
        );
      }
    } else {
      // Guest User Quota Check: 1 wish per day (IP tracked to prevent cookie-clearing spam)
      const { count, error: countErr } = await supabase
        .from("feature_requests")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .is("user_id", null)
        .gte("created_at", startOfToday.toISOString());

      if (countErr) throw countErr;

      if (count && count >= 1) {
        return NextResponse.json(
          { 
            error: "Daily quota limit reached. Guest explorers are limited to 1 feature request per day! Please sign in or upgrade to request more spells.",
            limitExceeded: true 
          },
          { status: 429 }
        );
      }
    }

    // 4. Insert new feature wish
    const { data: newWish, error: insertErr } = await supabase
      .from("feature_requests")
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        votes: 1,
        ip_address: ip,
        user_id: user ? user.id : null
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // 5. Automatically record this creator's IP in feature_votes (optimistic self-vote)
    const { error: selfVoteErr } = await supabase
      .from("feature_votes")
      .insert({
        feature_id: newWish.id,
        ip_address: ip
      });

    if (selfVoteErr) {
      console.error("Optimistic client self-vote logging failed:", selfVoteErr);
    }

    return NextResponse.json(newWish);
  } catch (err: any) {
    console.error("Create feature error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit feature request" },
      { status: 500 }
    );
  }
}
