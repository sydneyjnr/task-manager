// Client Component: runs in the browser, so it can use state (useState)
// and respond to clicks. It receives the tasks from page.tsx as a prop.
"use client";

import { useState } from "react";
import { createTask, deleteTask, toggleTask, updateTask } from "./actions";

// The shape of a task, as sent from page.tsx.
type Task = {
  id: number;
  title: string;
  completed: boolean;
};

// The main component: the add form, the filter and the list of tasks.
export default function TaskList({ tasks }: { tasks: Task[] }) {
  // Which tasks to show: "all", "active" or "completed".
  // This only changes what we show, so it lives in the browser (no database call).
  const [filter, setFilter] = useState("all");

  // Pick the tasks that match the current filter.
  let visibleTasks = tasks;
  if (filter === "active") {
    visibleTasks = tasks.filter((task) => !task.completed);
  } else if (filter === "completed") {
    visibleTasks = tasks.filter((task) => task.completed);
  }

  // Count the tasks that are not completed yet (always from ALL tasks).
  const remaining = tasks.filter((task) => !task.completed).length;

  return (
    <div>
      <AddTaskForm />

      {/* "flex-wrap" lets the buttons and the count wrap on small screens. */}
      <div className="my-5 flex flex-wrap items-center justify-between gap-2">
        <FilterButtons filter={filter} setFilter={setFilter} />
        <p className="text-sm text-gray-500">
          {remaining} {remaining === 1 ? "task" : "tasks"} left
        </p>
      </div>

      <EmptyMessage total={tasks.length} visible={visibleTasks.length} />

      {/* "divide-y" draws a thin line between the rows. */}
      <ul className="divide-y divide-gray-500/20">
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}

// Shown when there is nothing in the list.
function EmptyMessage({ total, visible }: { total: number; visible: number }) {
  if (total === 0) {
    return <p className="py-10 text-center text-sm text-gray-500">No tasks yet.</p>;
  }
  if (visible === 0) {
    // There are tasks, but none match the selected filter.
    return <p className="py-10 text-center text-sm text-gray-500">No tasks here.</p>;
  }
  return null; // Nothing to show: the list has tasks.
}

// The three filter buttons.
function FilterButtons({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (value: string) => void;
}) {
  return (
    // A grey "pill" track that holds the three buttons.
    <div className="flex gap-1 rounded-full bg-gray-500/10 p-1">
      <FilterButton value="all" label="All" filter={filter} setFilter={setFilter} />
      <FilterButton value="active" label="Active" filter={filter} setFilter={setFilter} />
      <FilterButton value="completed" label="Completed" filter={filter} setFilter={setFilter} />
    </div>
  );
}

// One pill-shaped filter button. The selected one is blue.
function FilterButton({
  value,
  label,
  filter,
  setFilter,
}: {
  value: string;
  label: string;
  filter: string;
  setFilter: (value: string) => void;
}) {
  const isSelected = filter === value;

  return (
    <button
      type="button"
      onClick={() => setFilter(value)}
      // aria-pressed tells screen readers which button is selected.
      aria-pressed={isSelected}
      className={
        isSelected
          ? "rounded-full bg-blue-600 px-3 py-1 text-sm text-white"
          : "rounded-full px-3 py-1 text-sm text-gray-500 hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}

// The form for adding a new task.
function AddTaskForm() {
  // The error message from the server, or "" when there is none.
  const [error, setError] = useState("");

  // Runs when the form is submitted. React passes us the form data.
  async function handleSubmit(formData: FormData) {
    const result = await createTask(formData);
    setError(result || "");
  }

  return (
    <form action={handleSubmit}>
      <div className="flex gap-2">
        {/* "required" and "maxLength" give quick feedback in the browser.
            The server checks the same rules again in actions.ts. */}
        <input
          name="title"
          placeholder="What needs to be done?"
          required
          maxLength={100}
          aria-label="New task title"
          // "min-w-0" lets the input shrink on narrow phone screens.
          className="min-w-0 flex-1 rounded-lg border border-gray-500/30 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}

// One row in the list: a checkbox, the title, and Edit/Delete buttons.
function TaskItem({ task }: { task: Task }) {
  // true while this row shows the edit form instead of the title.
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li className="py-2">
        <EditTaskForm task={task} onDone={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    // "hover:bg-gray-500/5" gives the row a faint background on hover.
    <li className="flex items-center gap-1 px-2 py-3 hover:bg-gray-500/5">
      {/* Wrapping the checkbox in a label lets you click the title too. */}
      <label className="flex min-w-0 flex-1 items-center gap-3">
        {/* "accent-blue-600" colours the tick box with our blue. */}
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
          className="size-5 shrink-0 accent-blue-600"
        />
        {/* "min-w-0 break-words" lets long titles wrap instead of
            overflowing on phones. Completed tasks are crossed out and greyed. */}
        <span
          className={
            task.completed
              ? "min-w-0 break-words text-gray-500 line-through"
              : "min-w-0 break-words"
          }
        >
          {task.title}
        </span>
      </label>

      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-500/10"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={() => deleteTask(task.id)}
        className="rounded-md px-2 py-1 text-sm text-red-600 hover:bg-red-500/10"
      >
        Delete
      </button>
    </li>
  );
}

// The form shown in a row while editing its title.
// "onDone" is a function from TaskItem that closes the form.
function EditTaskForm({ task, onDone }: { task: Task; onDone: () => void }) {
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    const result = await updateTask(formData);
    if (result) {
      setError(result); // Keep the form open and show the problem.
    } else {
      onDone(); // Saved, so go back to showing the title.
    }
  }

  return (
    <form action={handleSubmit}>
      <div className="flex items-center gap-2">
        {/* A hidden input sends the task's id along with the new title. */}
        <input type="hidden" name="id" value={task.id} />
        <input
          name="title"
          defaultValue={task.title}
          required
          maxLength={100}
          aria-label="Task title"
          className="min-w-0 flex-1 rounded-lg border border-gray-500/30 px-2 py-1"
        />
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md px-2 py-1 text-sm text-gray-500 hover:bg-gray-500/10"
        >
          Cancel
        </button>
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </form>
  );
}
