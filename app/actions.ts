"use server";

import { refresh } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";


async function getUserId() {
  const session = await auth();
  return session?.user?.id;
}


function validateTitle(title: string) {
  if (title === "") {
    return "Title is required.";
  }
  if (title.length > 100) {
    return "Title must be 100 characters or less.";
  }
  return null;
}


export async function createTask(formData: FormData) {
  const userId = await getUserId();
  if (!userId) {
    return "You must be signed in.";
  }

 
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
