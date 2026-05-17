import { NextRequest, NextResponse } from "next/server";
import { lemonSqueezySetup, createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Initialize Lemon Squeezy 
    // We do this inside the route using our env variables
    lemonSqueezySetup({
      apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
      onError: (error) => console.error("Lemon Squeezy Setup Error:", error),
    });

    const storeId = process.env.LEMON_SQUEEZY_STORE_ID;
    const variantId = process.env.LEMON_SQUEEZY_VARIANT_ID;

    if (!storeId || !variantId) {
      return NextResponse.json({ error: "Lemon Squeezy Store ID or Variant ID not configured." }, { status: 500 });
    }

    // 3. Create Checkout Link
    const newCheckout = await createCheckout(storeId, variantId, {
      checkoutData: {
        email: user.email,
        custom: {
          // This goes through the webhook so we know WHO bought unlimited
          user_id: user.id 
        }
      },
      productOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?success=true`,
      }
    });

    if (newCheckout.error) {
      console.error(newCheckout.error);
      return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
    }

    // Return URL string to the frontend to redirect the user natively
    return NextResponse.json({ url: newCheckout.data?.data.attributes.url });

  } catch (error: any) {
    console.error("Checkout route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
