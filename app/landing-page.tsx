// The landing page shown at "/". Everything for it lives in this file.
// It's a Server Component, so it can check the session on the server.
import Link from "next/link";
import { Suspense } from "react";
import { auth, signIn } from "@/auth";

export default function LandingPage() {
  return (
    // "flex-1" fills the screen height; the content sits in the middle.
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="max-w-lg text-center">
        <h1 className="mb-3 text-4xl font-bold">Task Manager</h1>
        <p className="mb-6 text-gray-500">
          Keep track of what you need to do. Add tasks, tick them off when
          they&apos;re done, and see what&apos;s left.
        </p>

        {/* The button depends on who is signed in, which is only known when
            someone visits, so it loads at request time (see tasks/page.tsx). */}
        <Suspense fallback={<div className="h-10" />}>
          <SignInOrGoToTasks />
        </Suspense>
      </div>
    </main>
  );
}

// Shows "Go to my tasks" if signed in, otherwise "Sign in with Google".
async function SignInOrGoToTasks() {
  const session = await auth();

  if (session?.user) {
    return (
      <Link href="/tasks" className="rounded bg-blue-600 px-4 py-2 text-white">
        Go to my tasks
      </Link>
    );
  }

  return (
    <form action={handleSignIn}>
      <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
        Sign in with Google
      </button>
    </form>
  );
}

// A Server Action that starts Google sign-in.
// Auth.js sends the user to Google, and after they sign in,
// brings them back to "/tasks".
async function handleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/tasks" });
}
