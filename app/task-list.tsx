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

      <FilterButtons filter={filter} setFilter={setFilter} />

      <p>
        {remaining} {remaining === 1 ? "task" : "tasks"} left
      </p>

      <ul>
        {visibleTasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
    </div>
  );
}

// The three filter buttons. The selected one is shown in bold.
function FilterButtons({
  filter,
  setFilter,
}: {
  filter: string;
  setFilter: (value: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={() => setFilter("all")}
        className={filter === "all" ? "font-bold" : ""}
      >
        All
      </button>
      <button
        type="button"
        onClick={() => setFilter("active")}
        className={filter === "active" ? "font-bold" : ""}
      >
        Active
      </button>
      <button
        type="button"
        onClick={() => setFilter("completed")}
        className={filter === "completed" ? "font-bold" : ""}
      >
        Completed
      </button>
    </div>
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
      {/* "required" and "maxLength" give quick feedback in the browser.
          The server checks the same rules again in actions.ts. */}
      <input
        name="title"
        placeholder="What needs to be done?"
        required
        maxLength={100}
      />
      <button type="submit">Add</button>

      {error && <p>{error}</p>}
    </form>
  );
}

// One row in the list: a checkbox, the title and a delete button.
function TaskItem({ task }: { task: Task }) {
  // true while this row shows the edit form instead of the title.
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <li>
        <EditTaskForm task={task} onDone={() => setIsEditing(false)} />
      </li>
    );
  }

  return (
    <li>
      {/* Wrapping the checkbox in a label lets you click the title too. */}
      <label>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => toggleTask(task.id)}
        />
        {/* Cross out the title when the task is completed. */}
        <span className={task.completed ? "line-through" : ""}>
          {task.title}
        </span>
      </label>

      <button type="button" onClick={() => setIsEditing(true)}>
        Edit
      </button>
      <button type="button" onClick={() => deleteTask(task.id)}>
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
      {/* A hidden input sends the task's id along with the new title. */}
      <input type="hidden" name="id" value={task.id} />
      <input
        name="title"
        defaultValue={task.title}
        required
        maxLength={100}
        aria-label="Task title"
      />
      <button type="submit">Save</button>
      <button type="button" onClick={onDone}>
        Cancel
      </button>

      {error && <p>{error}</p>}
    </form>
  );
}
