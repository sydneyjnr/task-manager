// Server Actions: functions that run on the server, but can be called
// from the browser (for example from a form). "use server" at the top
// marks every exported function in this file as a Server Action.
"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";

// Create a new task from the "add task" form.
// Returns an error message, or null if everything went well.
export async function createTask(formData: FormData) {
  // Read the "title" input and remove spaces at the start and end.
  const title = String(formData.get("title") || "").trim();

 
  if (title === "") {
    return "Title is required.";
  }
  if (title.length > 100) {
    return "Title must be 100 characters or less.";
  }

  await prisma.task.create({ data: { title } });

  // Tell Next.js to re-render the page so the new task shows up.
  refresh();
  return null;
}

// Flip a task between completed and not completed.
export async function toggleTask(id: number) {
  // The id comes from the browser, so check it's a whole number.
  if (!Number.isInteger(id)) {
    return;
  }

  // Find the task so we know its current value.
  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) {
    return; // The task doesn't exist (maybe it was deleted in another tab).
  }

  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });
  refresh();
}

// Delete a task.
export async function deleteTask(id: number) {
  if (!Number.isInteger(id)) {
    return;
  }

  // We use deleteMany instead of delete because it doesn't throw an error
  // if the task is already gone (for example, deleted in another tab).
  await prisma.task.deleteMany({ where: { id } });
  refresh();
}
