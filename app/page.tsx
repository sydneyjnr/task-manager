// The only page ("/"). It checks who is signed in and shows either
// the landing page or the user's tasks.
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/auth";
import LandingPage from "./landing-page";
import TasksView from "./tasks-view";

export default function Home() {
  return (
    // Why Suspense? With Cache Components turned on, Next.js builds a static
    // "shell" of the page ahead of time. Who is signed in is only known when
    // someone visits, so this part loads at request time, and the fallback
    // shows until it's ready.
    <Suspense fallback={<p className="p-4 text-gray-500">Loading...</p>}>
      <HomeContent />
    </Suspense>
  );
}

// Reads the session (from the cookie) and picks what to show.
async function HomeContent() {
  // Wait for a real request before going on. Without this, Next.js tries to
  // prerender this part and Auth.js generates random values while doing so.
  await connection();

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return <LandingPage />;
  }

  return <TasksView userId={userId} name={session.user?.name || "you"} />;
}
