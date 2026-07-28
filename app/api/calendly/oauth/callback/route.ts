import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

// GET /api/calendly/oauth/callback — échange du code contre des tokens
export async function GET(req: NextRequest) {
  await requireAdmin();
  const code = new URL(req.url).searchParams.get("code");
  if (!code) return NextResponse.redirect(`${process.env.APP_URL}/admin/calendly?error=no_code`);

  const redirectUri = `${process.env.APP_URL}/api/calendly/oauth/callback`;
  const basic = Buffer.from(
    `${process.env.CALENDLY_CLIENT_ID}:${process.env.CALENDLY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://auth.calendly.com/oauth/token", {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri }),
  });
  if (!res.ok) {
    return NextResponse.redirect(`${process.env.APP_URL}/admin/calendly?error=token_exchange`);
  }
  const tokens = await res.json();

  // Récupère l'organisation de l'utilisateur connecté
  const me = await fetch("https://api.calendly.com/users/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const meData = me.ok ? await me.json() : null;

  await db.calendlyConnection.upsert({
    where: { singleton: "main" },
    create: {
      singleton: "main",
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      organizationUri: meData?.resource?.current_organization,
      connectedAt: new Date(),
    },
    update: {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      organizationUri: meData?.resource?.current_organization,
      connectedAt: new Date(),
    },
  });

  return NextResponse.redirect(`${process.env.APP_URL}/admin/calendly?connected=1`);
}
