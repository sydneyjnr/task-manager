// Client Component: runs in the browser, so it can use state (useState)
// and respond to clicks. It receives the tasks from page.tsx as a prop.
"use client";

import { useState } from "react";
import { createTask, deleteTask, toggleTask } from "./actions";

// The shape of a task, as sent from page.tsx.
type Task = {
  id: number;
  title: string;
  completed: boolean;
};

// The main component: the add form and the list of tasks.
export default function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      <AddTaskForm />

      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </ul>
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

      <button type="button" onClick={() => deleteTask(task.id)}>
        Delete
      </button>
    </li>
  );
}
