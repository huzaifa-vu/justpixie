import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST() {
  try {
    // 1. Authenticate the active user to ensure they can only delete themselves!
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Must be logged in." }, { status: 401 });
    }

    // 2. Authenticate admin privileges securely on the backend
    const adminSupabase = createAdminClient();

    // 3. Purge the user permanently from the Auth database
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Account deletion failed:", error.message);
      return NextResponse.json({ error: "Failed to delete account from provider." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Account entirely purged." });

  } catch (err: any) {
    console.error("Deletion route error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
