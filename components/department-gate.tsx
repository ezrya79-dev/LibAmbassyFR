"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui";

type Rule = {
  departments: string;
  targetName: string;
  message: string;
  contactEmail: string;
};

export function DepartmentGate({
  rules,
  labels,
  children,
}: {
  rules: Rule[];
  labels: { yourDepartment: string; departmentHint: string; checkDepartment: string };
  children: React.ReactNode;
}) {
  const [dept, setDept] = useState("");
  const [blocked, setBlocked] = useState<Rule | null>(null);
  const [checked, setChecked] = useState(false);

  const normalized = dept.trim().padStart(2, "0");

  function check() {
    const rule = rules.find((r) =>
      r.departments
        .split(",")
        .map((d) => d.trim())
        .includes(normalized)
    );
    setBlocked(rule ?? null);
    setChecked(true);
  }

  if (checked && !blocked) return <>{children}</>;

  return (
    <div className="mx-auto max-w-xl rounded-xl border border-stone-200 bg-white p-6">
      <label className="mb-1 block text-sm font-medium">{labels.yourDepartment}</label>
      <div className="flex gap-2">
        <Input
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          placeholder={labels.departmentHint}
          maxLength={3}
        />
        <Button onClick={check}>{labels.checkDepartment}</Button>
      </div>
      {checked && blocked && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm">
          <div className="font-semibold text-amber-900">{blocked.targetName}</div>
          <p className="mt-1 text-amber-800">{blocked.message}</p>
          <p className="mt-2">
            Contact :{" "}
            <a className="font-medium underline" href={`mailto:${blocked.contactEmail}`}>
              {blocked.contactEmail}
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
