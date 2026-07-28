"use client";

import { useActionState, useState } from "react";
import { requestOtp, verifyOtp } from "@/lib/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function OtpLogin({
  labels,
}: {
  labels: { email: string; otpCode: string; verify: string; otpSent: string; login: string };
}) {
  const [email, setEmail] = useState("");
  const [reqState, reqAction, reqPending] = useActionState(requestOtp, null);
  const [verState, verAction, verPending] = useActionState(verifyOtp, null);

  return (
    <div className="mx-auto max-w-md rounded-xl border border-stone-200 bg-white p-6">
      {!reqState?.devCode ? (
        <form action={reqAction} className="space-y-4">
          <div>
            <Label htmlFor="email">{labels.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
            />
          </div>
          {reqState?.error && <p className="text-sm text-red-600">{reqState.error}</p>}
          <Button type="submit" disabled={reqPending} className="w-full">
            {labels.login}
          </Button>
        </form>
      ) : (
        <form action={verAction} className="space-y-4">
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
            {labels.otpSent}{" "}
            <span className="mt-1 block font-mono text-lg font-bold tracking-widest">
              {reqState.devCode}
            </span>
          </p>
          <input type="hidden" name="email" value={email} />
          <div>
            <Label htmlFor="code">{labels.otpCode}</Label>
            <Input id="code" name="code" inputMode="numeric" maxLength={6} required placeholder="000000" />
          </div>
          {verState?.error && <p className="text-sm text-red-600">{verState.error}</p>}
          <Button type="submit" disabled={verPending} className="w-full">
            {labels.verify}
          </Button>
        </form>
      )}
    </div>
  );
}
