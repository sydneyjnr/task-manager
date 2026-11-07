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
    // A centred column, max ~512px wide, with padding so it fits on phones.
    <main className="mx-auto w-full max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Task Manager</h1>

      <div className="mb-4 flex items-center justify-between gap-2 text-sm">
        <p className="min-w-0 truncate text-gray-500">Signed in as {name}</p>
        <form action={handleSignOut}>
          <button type="submit" className="rounded px-3 py-1 hover:bg-gray-500/20">
            Sign out
          </button>
        </form>
      </div>

      <TaskList tasks={tasks} />
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
