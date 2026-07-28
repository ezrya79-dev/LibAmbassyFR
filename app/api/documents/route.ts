import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getApplicant } from "@/lib/auth";

// POST /api/documents — upload d'une pièce jointe (multipart/form-data)
export async function POST(req: NextRequest) {
  const applicant = await getApplicant();
  if (!applicant) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const formalityId = (formData.get("formalityId") as string) || null;
  const type = (formData.get("type") as string) || "PIECE_JOINTE";
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const maxMb = Number(process.env.MAX_UPLOAD_MB ?? "500");
  if (file.size > maxMb * 1024 * 1024) {
    return NextResponse.json({ error: `Fichier trop volumineux (max ${maxMb} Mo)` }, { status: 413 });
  }

  const uploadDir = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
  await mkdir(uploadDir, { recursive: true });
  const safeName = file.name.replace(/[^\w.\-àâäéèêëîïôöùûüç ]/gi, "_");
  const fileName = `${crypto.randomUUID()}-${safeName}`;
  const filePath = path.join(uploadDir, fileName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const doc = await db.document.create({
    data: {
      applicantId: applicant.id,
      formalityId,
      type,
      fileName: file.name,
      filePath: fileName,
      size: file.size,
    },
  });
  return NextResponse.json({ ok: true, id: doc.id });
}
