// The landing page, shown at "/" when nobody is signed in.
// Everything for it lives in this file.
import { signIn } from "@/auth";

export default function LandingPage() {
  return (
    // "flex-1" fills the screen height; the content sits in the middle.
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        {/* Slightly smaller heading on phones ("sm:" = wider screens). */}
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Task Manager
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          A simple place to keep track of what you need to do.
        </p>

        <ul className="mt-6 space-y-1 text-gray-500">
          <li>
            <span className="text-blue-600">✓</span> Add tasks in seconds
          </li>
          <li>
            <span className="text-blue-600">✓</span> Tick them off when they&apos;re done
          </li>
          <li>
            <span className="text-blue-600">✓</span> Filter by active or completed
          </li>
        </ul>

        <form action={handleSignIn} className="mt-8">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
          >
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
