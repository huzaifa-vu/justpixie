import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_requests")
      .select("*")
      .order("votes", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data || []);
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

    // Limit long input hacks
    const cleanTitle = title.trim().slice(0, 100);
    const cleanCategory = category.trim().slice(0, 50);
    const cleanDescription = description.trim().slice(0, 500);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("feature_requests")
      .insert({
        title: cleanTitle,
        category: cleanCategory,
        description: cleanDescription,
        votes: 1
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Create feature error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to submit feature request" },
      { status: 500 }
    );
  }
}
