import type { Metadata } from "next";
import Link from "next/link";
import { safeRedirect } from "@/lib/safe-redirect";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const next = safeRedirect(redirect ?? null, "/account");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="lm-display text-3xl" style={{ color: "var(--lm-text)" }}>
          Create your account
        </h1>
        <p className="text-sm" style={{ color: "var(--lm-muted)" }}>
          So your orders are tracked and waiting when you return.
        </p>
      </header>

      <SignUpForm redirect={next} />

      <p className="text-center text-sm" style={{ color: "var(--lm-muted)" }}>
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(next)}`}
          className="underline-offset-2 hover:underline"
          style={{ color: "var(--lm-warm)" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
