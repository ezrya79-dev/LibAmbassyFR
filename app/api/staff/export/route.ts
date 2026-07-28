import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";

// GET /api/staff/export — export CSV des rendez-vous (scopé par rôle)
export async function GET() {
  const user = await requireStaff();
  const scopedIds: string[] = user.role === "AGENT" ? JSON.parse(user.serviceIds || "[]") : [];

  const appointments = await db.appointment.findMany({
    where: scopedIds.length ? { formality: { serviceId: { in: scopedIds } } } : {},
    include: { applicant: true, formality: { include: { service: true } } },
    orderBy: { startAt: "desc" },
  });

  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [
    ["Date", "Heure", "Nom", "Prénom", "Email", "Téléphone", "Service", "Formalité", "Statut"].map(esc).join(";"),
    ...appointments.map((a) =>
      [
        a.startAt?.toLocaleDateString("fr-FR"),
        a.startAt?.toLocaleTimeString("fr-FR"),
        a.applicant.lastName,
        a.applicant.firstName,
        a.applicant.email,
        a.applicant.phone,
        a.formality.service.name,
        a.formality.name,
        a.status,
      ].map(esc).join(";")
    ),
  ];

  return new NextResponse("﻿" + rows.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="rdv-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
