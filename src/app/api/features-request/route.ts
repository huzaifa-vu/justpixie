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

    // Extract client's IP
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // Limit long input hacks
    const cleanTitle = title.trim().slice(0, 100);
    const cleanCategory = category.trim().slice(0, 50);
    const cleanDescription = description.trim().slice(0, 500);

    const supabase = await createClient();

    // 1. Insert new feature wish
    const { data: newWish, error: insertErr } = await supabase
      .from("feature_requests")
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        votes: 1
      })
      .select()
      .single();

    if (insertErr) {
      throw insertErr;
    }

    // 2. Automatically record this creator's IP in feature_votes (optimistic self-vote)
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
