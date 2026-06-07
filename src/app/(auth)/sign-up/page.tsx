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
        <h1 className="font-display text-3xl text-lumen-ink">
          Create your account
        </h1>
        <p className="text-sm text-lumen-ink/70">
          So your orders are tracked and waiting when you return.
        </p>
      </header>

      <SignUpForm redirect={next} />

      <p className="text-center text-sm text-lumen-ink/70">
        Already have an account?{" "}
        <Link
          href={`/sign-in?redirect=${encodeURIComponent(next)}`}
          className="text-lumen-blue underline-offset-2 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
