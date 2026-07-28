import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

// GET /api/staff/documents/[id] — prévisualisation sécurisée d'une pièce
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const doc = await db.document.findUnique({ where: { id } });
  if (!doc) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  const filePath = path.join(uploadDir, path.basename(doc.filePath)); // anti path-traversal
  try {
    const data = await readFile(filePath);
    const ext = path.extname(doc.fileName).toLowerCase();
    const mime =
      ext === ".pdf" ? "application/pdf"
      : ext === ".png" ? "image/png"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : "application/octet-stream";
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": mime, "Content-Disposition": `inline; filename="${doc.fileName}"` },
    });
  } catch {
    return NextResponse.json({ error: "Fichier absent du stockage" }, { status: 404 });
  }
}
