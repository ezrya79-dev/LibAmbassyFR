import { redirect } from "next/navigation";
import { getApplicant } from "@/lib/auth";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { UploadForm } from "@/components/upload-form";
import { Card, Badge } from "@/components/ui";
import { FileIcon } from "lucide-react";

const STATUS_TONE: Record<string, "neutral" | "green" | "red" | "amber" | "blue"> = {
  RECEIVED: "blue",
  VALIDATED: "green",
  REJECTED: "red",
  MORE_INFO: "amber",
};

export default async function DocumentsPage() {
  const dict = await t();
  const applicant = await getApplicant();
  if (!applicant) redirect("/profil");

  const [documents, formalities] = await Promise.all([
    db.document.findMany({
      where: { applicantId: applicant.id },
      orderBy: { createdAt: "desc" },
      include: { formality: true },
    }),
    db.formality.findMany({
      where: { active: true },
      include: { service: true },
      orderBy: [{ service: { order: "asc" } }, { order: "asc" }],
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">{dict.attachDocuments}</h1>
      <p className="mt-1 text-sm text-stone-500">
        Déposez les pièces justificatives rattachées à votre dossier ({applicant.email}).
      </p>

      <Card className="mt-6">
        <UploadForm
          formalities={formalities.map((f) => ({ id: f.id, name: f.name, serviceName: f.service.name }))}
          maxMb={Number(process.env.MAX_UPLOAD_MB ?? "500")}
          uploadLabel={dict.upload}
        />
      </Card>

      <h2 className="mt-8 mb-3 font-semibold">Vos documents</h2>
      {documents.length === 0 ? (
        <p className="text-sm text-stone-500">Aucun document déposé pour le moment.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <FileIcon className="h-4 w-4 text-stone-400" />
                <div>
                  <div className="font-medium">{d.fileName}</div>
                  <div className="text-xs text-stone-500">
                    {d.formality ? `${d.formality.name} · ` : ""}
                    {(d.size / 1024 / 1024).toFixed(2)} Mo · {d.createdAt.toLocaleDateString("fr-FR")}
                  </div>
                </div>
              </div>
              <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status}</Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
