import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    // 1. Capture Raw Body and Signature for security verification
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature." }, { status: 400 });
    }

    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret missing in env." }, { status: 500 });
    }

    // 2. Verify Signature
    const hmac = crypto.createHmac("sha256", secret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 403 });
    }

    // 3. Parse Verified Payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;

    // We only care when an order/subscription is created successfully
    if (eventName === "order_created" || eventName === "subscription_created") {
      const userId = customData?.user_id;

      if (!userId) {
        console.error("Webhook payload missing user_id in custom_data");
        return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
      }

      // 4. Connect to Supabase Admin and Upgrade the User
      const adminClient = createAdminClient();
      
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        user_metadata: { tier: "unlimited" }
      });

      if (error) {
        console.error("Supabase Admin update failed:", error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`Successfully upgraded user ${userId} to unlimited!`);
    }

    return NextResponse.json({ message: "Webhook received correctly" });

  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
