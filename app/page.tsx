// The home page. This is a Server Component (the default in the App Router),
// so it runs on the server and can read from the database directly.
import { Suspense } from "react";
import { io } from "next/cache";
import { prisma } from "@/lib/prisma";
import TaskList from "./task-list";

export default function Home() {
  return (
    // A centred column, max ~512px wide, with padding so it fits on phones.
    <main className="mx-auto w-full max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Task Manager</h1>

      {/*
        Why Suspense? With Cache Components turned on, Next.js builds a static
        "shell" of the page ahead of time. Our tasks must be fresh on every
        request, so they can't be part of that shell. Suspense marks this part
        as "load at request time" and shows the fallback until it's ready.
      */}
      <Suspense fallback={<p className="text-gray-500">Loading tasks...</p>}>
        <Tasks />
      </Suspense>
    </main>
  );
}

// Loads the tasks from the database and passes them to the Client Component.
async function Tasks() {
  // Tell Next.js "database work happens below, don't run it while building
  // the static shell". Without this the build fails, because Prisma reads
  // the current time (Date.now()) inside the query.
  await io();

  const tasks = await prisma.task.findMany({
    // Only send the fields the page needs.
    select: { id: true, title: true, completed: true },
    // Newest tasks first.
    orderBy: { createdAt: "desc" },
  });

  return <TaskList tasks={tasks} />;
}
