// The landing page, shown at "/" when nobody is signed in.
// Everything for it lives in this file: navbar, hero, features and footer.
//
// Styling notes (kept consistent across the page):
// - Accent colour: blue-600 (the same blue the tasks page uses).
// - Neutral greys use "gray-500/xx" so they work in light and dark mode.
// - Corners: rounded-lg on buttons, rounded-xl on cards.
// - Content width: max-w-5xl, with px-6 side padding everywhere.
import { signIn } from "@/auth";

// The real features of the app. Each one becomes a card in the Features section.
const features = [
  {
    title: "Add tasks quickly",
    description: "Type a title and press enter, and it goes straight onto your list.",
  },
  {
    title: "Edit and tick off",
    description: "Rename a task at any time, mark it done when it's finished, or delete it.",
  },
  {
    title: "Filter your list",
    description: "Switch between all, active and completed tasks, and see how many are left.",
  },
  {
    title: "Private to your account",
    description: "Sign in with Google and only you can see and change your tasks.",
  },
];

export default function LandingPage() {
  return (
    // "flex-1" makes the page fill the screen so the footer sits at the bottom.
    <div className="flex flex-1 flex-col">
      <Navbar />

      <main className="flex-1">
        <Hero />
        <Features />
      </main>

      <Footer />
    </div>
  );
}

// Top bar: the app name as plain text, and a small sign-in button.
function Navbar() {
  return (
    <header className="border-b border-gray-500/20">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <span className="text-base font-semibold tracking-tight">Task Manager</span>
        <SignInButton label="Sign in" size="small" />
      </div>
    </header>
  );
}

// The headline, one supporting sentence and the main sign-in button.
function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20 sm:py-28">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          A simple list for everything you need to get done.
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-gray-500">
          Task Manager lets you add tasks, mark them complete and keep your list
          tidy, all saved to your own account.
        </p>
        <div className="mt-8">
          <SignInButton label="Sign in with Google" size="large" />
        </div>
      </div>
    </section>
  );
}

// A grid of feature cards: one column on phones, two on wider screens.
function Features() {
  return (
    <section className="border-t border-gray-500/20">
      <div className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
        <h2 className="text-2xl font-semibold tracking-tight">What you can do</h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <li
              key={feature.title}
              className="rounded-xl border border-gray-500/20 p-6"
            >
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-500">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-gray-500/20">
      <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-gray-500">
        Task Manager
      </div>
    </footer>
  );
}

// One button style for both sign-in buttons, in two sizes.
// Each is a small form that runs the handleSignIn Server Action below.
function SignInButton({ label, size }: { label: string; size: "small" | "large" }) {
  const sizeClasses = size === "large" ? "px-6 py-3 text-base" : "px-4 py-2 text-sm";

  return (
    <form action={handleSignIn}>
      <button
        type="submit"
        className={`rounded-lg bg-blue-600 font-medium text-white hover:bg-blue-700 ${sizeClasses}`}
      >
        {label}
      </button>
    </form>
  );
}

// A Server Action that starts Google sign-in.
// Auth.js sends the user to Google, and after they sign in,
// brings them back to "/", which now shows their tasks.
async function handleSignIn() {
  "use server";
  await signIn("google", { redirectTo: "/" });
}
