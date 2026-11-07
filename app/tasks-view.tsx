// What a signed-in user sees at "/": who they are, a Sign out button,
// and their task list. It's a Server Component, so it can query the
// database directly.
import { prisma } from "@/lib/prisma";
import { signOut } from "@/auth";
import TaskList from "./task-list";

// "userId" and "name" come from page.tsx, which got them from auth() on the
// server. They are never sent up from the browser.
export default async function TasksView({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  // Only load this user's tasks.
  const tasks = await prisma.task.findMany({
    where: { userId },
    // Only send the fields the page needs.
    select: { id: true, title: true, completed: true },
    // Newest tasks first.
    orderBy: { createdAt: "desc" },
  });

  return (
    // Outer: a softly tinted background that fills the screen.
    <main className="flex-1 bg-gray-500/5 px-4 py-8">
      {/* Inner: a centred card, max ~512px wide. "bg-background" is the
          page colour from globals.css (white, or near-black in dark mode). */}
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-500/20 bg-background p-5 shadow-sm">
        <header className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">Task Manager</h1>
            <p className="truncate text-sm text-gray-500">Signed in as {name}</p>
          </div>
          {/* "shrink-0" keeps the button from squashing on narrow phones. */}
          <form action={handleSignOut} className="shrink-0">
            <button
              type="submit"
              className="rounded-lg border border-gray-500/30 px-3 py-1.5 text-sm hover:bg-gray-500/10"
            >
              Sign out
            </button>
          </form>
        </header>

        <TaskList tasks={tasks} />
      </div>
    </main>
  );
}

// A Server Action that signs out ("use server" makes it run on the server).
// Auth.js deletes the session, then sends the user back to "/",
// which now shows the landing page.
async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}
