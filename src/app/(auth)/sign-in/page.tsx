import type { Metadata } from "next";
import Link from "next/link";
import { safeRedirect } from "@/lib/safe-redirect";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}) {
  const { redirect, error } = await searchParams;
  const next = safeRedirect(redirect ?? null, "/account");
  const linkError =
    error === "link_invalid"
      ? "That link is invalid or has expired. Please sign in or request a new one."
      : undefined;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="font-display text-3xl text-lumen-ink">Welcome back</h1>
        <p className="text-sm text-lumen-ink/70">
          Sign in to track orders and check out faster.
        </p>
      </header>

      <SignInForm redirect={next} linkError={linkError} />

      <p className="text-center text-sm text-lumen-ink/70">
        New to Lumen?{" "}
        <Link
          href={`/sign-up?redirect=${encodeURIComponent(next)}`}
          className="text-lumen-blue underline-offset-2 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
