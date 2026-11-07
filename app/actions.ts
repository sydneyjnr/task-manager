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

  // Validate on the server. The browser also checks this, but anyone can
  // send a request directly to a Server Action, so we can't trust the browser.
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
