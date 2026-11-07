// The tasks page ("/tasks"). This is a Server Component, so it runs on the
// server and can read from the database and the session directly.
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { auth, signOut } from "@/auth";
import TaskList from "@/app/task-list";

export default function TasksPage() {
  return (
    // A centred column, max ~512px wide, with padding so it fits on phones.
    <main className="mx-auto w-full max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Task Manager</h1>

      {/*
        Why Suspense? With Cache Components turned on, Next.js builds a static
        "shell" of the page ahead of time. Who is signed in and their tasks
        are different on every request, so they can't be part of that shell.
        Suspense marks this part as "load at request time" and shows the
        fallback until it's ready.
      */}
      <Suspense fallback={<p className="text-gray-500">Loading tasks...</p>}>
        <TasksContent />
      </Suspense>
    </main>
  );
}

// Loads the signed-in user and the tasks, then shows them.
async function TasksContent() {
  // auth() reads the session cookie, so it only runs at request time.
  // That also stops the database query below from running during the build.
  const session = await auth();

  const tasks = await prisma.task.findMany({
    // Only send the fields the page needs.
    select: { id: true, title: true, completed: true },
    // Newest tasks first.
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <UserBar name={session?.user?.name || "you"} />
      <TaskList tasks={tasks} />
    </>
  );
}

// Shows who is signed in and a "Sign out" button.
function UserBar({ name }: { name: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2 text-sm">
      <p className="min-w-0 truncate text-gray-500">Signed in as {name}</p>
      <form action={handleSignOut}>
        <button type="submit" className="rounded px-3 py-1 hover:bg-gray-500/20">
          Sign out
        </button>
      </form>
    </div>
  );
}

// A Server Action that signs out ("use server" makes it run on the server).
// Auth.js deletes the session, then sends the user back to the landing page.
async function handleSignOut() {
  "use server";
  await signOut({ redirectTo: "/" });
}
