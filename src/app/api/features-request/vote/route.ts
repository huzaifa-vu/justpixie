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

    // 1. Extract client IP address
    const ip = (req as any).ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

    // 2. Query existing vote record for this IP and feature
    const { data: existingVote, error: checkErr } = await supabase
      .from("feature_votes")
      .select("id")
      .eq("feature_id", id)
      .eq("ip_address", ip)
      .maybeSingle();

    if (checkErr) {
      throw checkErr;
    }

    // 3. Query current wish details
    const { data: currentFeature, error: fetchErr } = await supabase
      .from("feature_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentFeature) {
      return NextResponse.json({ error: "Feature request not found" }, { status: 404 });
    }

    let finalFeature = currentFeature;

    if (increment === 1) {
      // UPVOTE SPAM GUARD
      if (existingVote) {
        // IP has already upvoted this feature! Silently block the spam and return current details.
        return NextResponse.json(currentFeature);
      }

      // Record the IP vote
      const { error: recordVoteErr } = await supabase
        .from("feature_votes")
        .insert({
          feature_id: id,
          ip_address: ip
        });

      if (recordVoteErr) {
        // If unique constraint violation occurred concurrently
        if (recordVoteErr.code === "23505") {
          return NextResponse.json(currentFeature);
        }
        throw recordVoteErr;
      }

      // Increment total count in database
      const newVotes = currentFeature.votes + 1;
      const { data: updatedFeature, error: updateErr } = await supabase
        .from("feature_requests")
        .update({ votes: newVotes })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      finalFeature = updatedFeature;

    } else if (increment === -1) {
      // DOWNVOTE SPAM GUARD
      if (!existingVote) {
        // IP hasn't voted for this feature yet! Block invalid downvotes.
        return NextResponse.json(currentFeature);
      }

      // Delete the IP vote record
      const { error: deleteVoteErr } = await supabase
        .from("feature_votes")
        .delete()
        .eq("feature_id", id)
        .eq("ip_address", ip);

      if (deleteVoteErr) throw deleteVoteErr;

      // Decrement total count in database safely
      const newVotes = Math.max(0, currentFeature.votes - 1);
      const { data: updatedFeature, error: updateErr } = await supabase
        .from("feature_requests")
        .update({ votes: newVotes })
        .eq("id", id)
        .select()
        .single();

      if (updateErr) throw updateErr;
      finalFeature = updatedFeature;
    }

    return NextResponse.json(finalFeature);
  } catch (err: any) {
    console.error("Voting system validation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to update wish support" },
      { status: 500 }
    );
  }
}
