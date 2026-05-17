import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { id, increment } = await req.json();

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Feature request ID is required" }, { status: 400 });
    }
    if (typeof increment !== "number" || (increment !== 1 && increment !== -1)) {
      return NextResponse.json({ error: "Increment value must be 1 or -1" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch current votes count to avoid client-side state assumptions
    const { data: currentFeature, error: fetchErr } = await supabase
      .from("feature_requests")
      .select("votes")
      .eq("id", id)
      .single();

    if (fetchErr || !currentFeature) {
      return NextResponse.json({ error: "Feature request not found" }, { status: 404 });
    }

    // 2. Compute safe new vote count (prevent negative counts)
    const newVotes = Math.max(0, currentFeature.votes + increment);

    // 3. Update the remote table
    const { data, error } = await supabase
      .from("feature_requests")
      .update({ votes: newVotes })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Voting system error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update wish support" },
      { status: 500 }
    );
  }
}
