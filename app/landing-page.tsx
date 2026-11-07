// The landing page, shown at "/" when nobody is signed in.
// Everything for it lives in this file.
import { signIn } from "@/auth";

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

        <form action={handleSignIn}>
          <button type="submit" className="rounded bg-blue-600 px-4 py-2 text-white">
            Sign in with Google
          </button>
        </form>
      </div>
    </main>
  );
}

// A Server Action that starts Google sign-in.
// Auth.js sends the user to Google, and after they sign in,
// brings them back to "/", which now shows their tasks.
async function handleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}
