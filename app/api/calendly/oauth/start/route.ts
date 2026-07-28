import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

// GET /api/calendly/oauth/start — démarre le flux OAuth2 Calendly (admin)
export async function GET() {
  await requireAdmin();
  const clientId = process.env.CALENDLY_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "CALENDLY_CLIENT_ID non configuré dans .env" }, { status: 500 });
  }
  const redirectUri = `${process.env.APP_URL}/api/calendly/oauth/callback`;
  const url = new URL("https://auth.calendly.com/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUri);
  return NextResponse.redirect(url);
}
