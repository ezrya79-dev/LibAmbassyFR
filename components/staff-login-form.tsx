"use client";

import { useActionState } from "react";
import { staffLogin } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function StaffLoginForm({ labels }: { labels: { email: string; password: string; login: string } }) {
  const [state, formAction, pending] = useActionState(staffLogin, null);

  return (
    <form action={formAction} className="mx-auto max-w-md space-y-4 rounded-xl border border-stone-200 bg-white p-6">
      <div>
        <Label htmlFor="email">{labels.email}</Label>
        <Input id="email" name="email" type="email" required autoComplete="username" />
      </div>
      <div>
        <Label htmlFor="password">{labels.password}</Label>
        <Input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <div>
        <Label htmlFor="mfaCode">Code MFA (si activé)</Label>
        <Input id="mfaCode" name="mfaCode" inputMode="numeric" maxLength={6} placeholder="000000" />
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {labels.login}
      </Button>
      <p className="text-xs text-stone-400">
        Démo : admin@ambassadeliban.fr / Admin123! · superviseur@ambassadeliban.fr / Super123! ·
        agent.passeport@ambassadeliban.fr / Agent123!
      </p>
    </form>
  );
}
