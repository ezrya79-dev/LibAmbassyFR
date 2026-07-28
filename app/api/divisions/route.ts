import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/divisions?level=1  ou  ?parentId=xxx  → enfants d'une division
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const level = searchParams.get("level");
  const parentId = searchParams.get("parentId");

  const where: { level?: number; parentId?: string | null } = {};
  if (level) where.level = Number(level);
  if (parentId) where.parentId = parentId;
  else if (level === "1") where.parentId = null;

  const divisions = await db.adminDivision.findMany({
    where,
    orderBy: { name: "asc" },
    select: { id: true, name: true, level: true, parentId: true },
  });
  return NextResponse.json(divisions);
}
