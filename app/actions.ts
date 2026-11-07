// Server Actions: functions that run on the server, but can be called
// from the browser (for example from a form). "use server" at the top
// marks every exported function in this file as a Server Action.
"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Returns the id of the signed-in user, or undefined if nobody is signed in.
// The id comes from the session cookie, checked on the server by Auth.js.
// We never take a user id from the browser, because it could be faked.
// (Not exported, so it's a normal helper, not a Server Action.)
async function getUserId() {
  const session = await auth();
  return session?.user?.id;
}

// Checks a title. Returns an error message, or null if the title is OK.
// Used by both createTask and updateTask so the rules are in one place.
// (Not exported, so it's a normal helper, not a Server Action.)
function validateTitle(title: string) {
  if (title === "") {
    return "Title is required.";
  }
  if (title.length > 100) {
    return "Title must be 100 characters or less.";
  }
  return null;
}

// Create a new task from the "add task" form.
// Returns an error message, or null if everything went well.
export async function createTask(formData: FormData) {
  const userId = await getUserId();
  if (!userId) {
    return "You must be signed in.";
  }

  // Read the "title" input and remove spaces at the start and end.
  const title = String(formData.get("title") || "").trim();

  const error = validateTitle(title);
  if (error) {
    return error;
  }

  // Save the task as belonging to this user.
  await prisma.task.create({ data: { title, userId } });

  // Tell Next.js to re-render the page so the new task shows up.
  refresh();
  return null;
}

// Change a task's title, from the "edit" form.
// Returns an error message, or null if everything went well.
export async function updateTask(formData: FormData) {
  const userId = await getUserId();
  if (!userId) {
    return "You must be signed in.";
  }

  // Form values are always text, so turn the id into a number.
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") || "").trim();

  if (!Number.isInteger(id)) {
    return "Invalid task.";
  }
  const error = validateTitle(title);
  if (error) {
    return error;
  }

  // "where: { id, userId }" only matches the task if it belongs to this
  // user, so nobody can change someone else's task by sending its id.
  // updateMany (like deleteMany below) doesn't throw an error
  // if no task matches.
  await prisma.task.updateMany({ where: { id, userId }, data: { title } });
  refresh();
  return null;
}

// Flip a task between completed and not completed.
export async function toggleTask(id: number) {
  const userId = await getUserId();
  if (!userId) {
    return;
  }

  // The id comes from the browser, so check it's a whole number.
  if (!Number.isInteger(id)) {
    return;
  }

  // Find the task, but only if it belongs to this user.
  const task = await prisma.task.findFirst({ where: { id, userId } });
  if (!task) {
    return; // Not found, or it's someone else's task.
  }

  await prisma.task.update({
    where: { id },
    data: { completed: !task.completed },
  });
  refresh();
}

// Delete a task.
export async function deleteTask(id: number) {
  const userId = await getUserId();
  if (!userId) {
    return;
  }

  if (!Number.isInteger(id)) {
    return;
  }

  // Only deletes the task if it belongs to this user.
  // deleteMany doesn't throw an error if no task matches.
  await prisma.task.deleteMany({ where: { id, userId } });
  refresh();
}
