import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, Badge } from "@/components/ui";
import { AppointmentActions, NoteForm, DocumentActions, MoreInfoForm } from "@/components/staff-actions";
import { FileIcon } from "lucide-react";

const TONE: Record<string, "neutral" | "green" | "red" | "amber" | "blue"> = {
  SCHEDULED: "blue", CANCELED: "red", COMPLETED: "green", NO_SHOW: "amber",
  RECEIVED: "blue", VALIDATED: "green", REJECTED: "red", MORE_INFO: "amber",
};

export default async function ApplicantFilePage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const applicant = await db.applicant.findUnique({
    where: { id },
    include: {
      nationalities: { orderBy: { rank: "asc" } },
      documents: { orderBy: { createdAt: "desc" }, include: { formality: true } },
      appointments: { orderBy: { startAt: "desc" }, include: { formality: { include: { service: true } } } },
    },
  });
  if (!applicant) notFound();

  const divisions = await db.adminDivision.findMany({
    where: { id: { in: [applicant.mouhafazaId, applicant.kazaId, applicant.communeId].filter(Boolean) as string[] } },
  });
  const divName = (id?: string | null) => divisions.find((d) => d.id === id)?.name ?? "—";

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/staff" className="text-sm text-stone-500 hover:underline">← Retour aux rendez-vous</Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {applicant.firstName} {applicant.lastName}
          <Badge tone={applicant.status === "ACTIF" ? "green" : "amber"}>{applicant.status}</Badge>
        </h1>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold">Profil</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-stone-500">Email</dt><dd>{applicant.email}</dd>
            <dt className="text-stone-500">Téléphone</dt><dd>{applicant.phone ?? "—"}</dd>
            <dt className="text-stone-500">Naissance</dt><dd>{applicant.birthDate ?? "—"}</dd>
            <dt className="text-stone-500">Nationalités</dt>
            <dd>{applicant.nationalities.map((n) => n.country).join(", ") || "—"}</dd>
            <dt className="text-stone-500">Adresse FR</dt>
            <dd>{[applicant.addressFrStreet, applicant.addressFrZip, applicant.addressFrCity, applicant.addressFrDept && `(${applicant.addressFrDept})`].filter(Boolean).join(" ") || "—"}</dd>
            <dt className="text-stone-500">Adresse Liban</dt>
            <dd>{[divName(applicant.communeId), divName(applicant.kazaId), divName(applicant.mouhafazaId)].filter((v) => v !== "—").join(", ") || "—"}</dd>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold">Actions</h2>
          <div className="space-y-4">
            <MoreInfoForm applicantId={applicant.id} />
            <div>
              <h3 className="mb-1 text-sm font-medium text-stone-600">Notes internes</h3>
              {applicant.notes && (
                <pre className="mb-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-stone-50 p-3 text-xs">{applicant.notes}</pre>
              )}
              <NoteForm applicantId={applicant.id} />
            </div>
          </div>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Rendez-vous</h2>
        {applicant.appointments.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun rendez-vous.</p>
        ) : (
          <ul className="space-y-3">
            {applicant.appointments.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 p-3 text-sm">
                <div>
                  <div className="font-medium">{a.formality.service.name} — {a.formality.name}</div>
                  <div className="text-xs text-stone-500">
                    {a.startAt ? a.startAt.toLocaleString("fr-FR") : "—"} · <Badge tone={TONE[a.status]}>{a.status}</Badge>
                  </div>
                </div>
                <AppointmentActions appointmentId={a.id} current={a.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="mt-6">
        <h2 className="mb-3 font-semibold">Documents</h2>
        {applicant.documents.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun document déposé.</p>
        ) : (
          <ul className="space-y-2">
            {applicant.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-stone-200 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4 text-stone-400" />
                  <div>
                    <div className="font-medium">{d.fileName}</div>
                    <div className="text-xs text-stone-500">
                      {d.formality?.name ?? "Document général"} · {(d.size / 1024 / 1024).toFixed(2)} Mo ·{" "}
                      <a href={`/api/staff/documents/${d.id}`} className="underline">Prévisualiser</a>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={TONE[d.status]}>{d.status}</Badge>
                  <DocumentActions documentId={d.id} applicantId={applicant.id} current={d.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
