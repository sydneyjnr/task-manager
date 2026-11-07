# Interview Notes – Task Manager

A small task manager built with Next.js 16 (App Router), TypeScript, Tailwind CSS,
Prisma and MySQL. You can add, complete, edit, delete and filter tasks.

## What each file does

**My 5 code files**

| File | What it does |
| --- | --- |
| `prisma/schema.prisma` | Describes the database. It has one model, `Task` (id, title, completed, createdAt, updatedAt). Prisma uses it to create migrations and to generate a typed client. |
| `lib/prisma.ts` | Creates one shared Prisma Client that talks to MySQL. In development it is saved on `globalThis` so hot reloads don't keep opening new database connections. |
| `app/actions.ts` | The Server Actions: `createTask`, `updateTask`, `toggleTask` and `deleteTask`. They run on the server, check the input, change the database and call `refresh()` so the page shows the new data. |
| `app/page.tsx` | The home page, a Server Component. It reads the tasks from the database with Prisma and passes them to the client component. |
| `app/task-list.tsx` | A Client Component with the add form, the filter buttons, the "tasks left" count and the task rows (including editing). It uses small helper components inside the file. |

**Supporting files**

- `prisma.config.ts`: settings for the Prisma CLI (where the schema and migrations are, and the database URL). Prisma 7 requires this file.
- `prisma/migrations/`: the SQL that Prisma generated to create the `Task` table.
- `.env` (not in git) holds the real `DATABASE_URL`. `.env.example` shows the format without the password.
- `app/layout.tsx`: I only changed the page title.

## What happens when I add a task

1. I type a title and click **Add**. The browser first checks `required` and `maxLength={100}`, and stops the submit if they fail.
2. The `<form action={handleSubmit}>` in `AddTaskForm` calls `handleSubmit` with the form data.
3. `handleSubmit` calls `createTask(formData)`. It looks like a normal function call, but because `createTask` is a Server Action, Next.js sends it to the server as a POST request.
4. On the server, `createTask` reads and trims the title and checks it with `validateTitle` (not empty, at most 100 characters). If it is invalid, it returns an error message.
5. If it is valid, `prisma.task.create(...)` inserts a new row into the MySQL `Task` table. MySQL gives it the next id. `completed` defaults to `false`, and `createdAt` and `updatedAt` are filled in automatically (because of `@default(now())` and `@updatedAt` in the schema).
6. `refresh()` tells Next.js to re-render the page. `page.tsx` runs again on the server and loads the tasks from the database, now including the new one.
7. The server sends back the result (`null`, meaning "no error") together with the updated page, in one response.
8. In the browser, React shows the new list and `handleSubmit` clears any old error. React also resets the form, so the input is empty again.

## Key decisions

| Decision | Why | One alternative |
| --- | --- | --- |
| **Server Actions** instead of API routes | Less code: there are no URLs, `fetch` calls or JSON handling to write. I call a function and Next.js handles the request. They also work with normal HTML forms. | **Route Handlers** (`app/api/tasks/route.ts`) with `fetch` from the client. That's better if other apps, such as a mobile app, need to use the same API. |
| **Prisma** as the database tool | The schema is easy to read, it creates the migrations for me, and its queries are type-safe, so TypeScript knows a task has a `title`. I don't write SQL by hand. | **Drizzle ORM**, or plain SQL with the `mysql2` package. |
| **Autoincrement `Int` ids** | Simple, small and easy to read (1, 2, 3...). MySQL creates them for me, and they're fine for an app with one database and no logins. | **UUIDs or CUIDs** (`String @default(uuid())`). They're harder to guess and can be created without asking the database, which is useful in bigger or public apps. |
| **Validation on the server** (in `actions.ts`), plus simple browser checks | Anyone can send a request straight to a Server Action, so the server must check everything. The browser checks (`required`, `maxLength`) are only for quick feedback. The database column is also `VarChar(100)`, a final safety net. | A validation library such as **Zod**, which is useful when there are many fields. Here two if-checks were enough. |
| **Filter in `useState`** in the browser | The filter only changes what is shown, not the data, so there is no need to ask the server. Switching is instant. | Put the filter in the URL (`?filter=active`) and filter in the database query. Then the filter survives a page reload and can be shared as a link. |
| **`refresh()`** after each change | Next.js 16 recommends it for refreshing the page when the data isn't cached. | `revalidatePath("/")`, the older and well-known way. |
| **`<Suspense>` and `await io()`** in `page.tsx` | This project has Next.js **Cache Components** turned on, so Next.js tries to build a static version of the page at build time. Tasks must be fresh on every request. `<Suspense>` marks the task list as "load at request time" and shows "Loading tasks..." meanwhile. `await io()` was needed because the build failed: Prisma reads the current time inside its query, which isn't allowed while prerendering. | Turn Cache Components off in `next.config.ts`. Then the page is simply rendered on every request, without Suspense. |

## Likely interview questions

**1. What's the difference between `page.tsx` and `task-list.tsx`?**
`page.tsx` is a Server Component: it runs only on the server, so it can safely read the database, and its code never reaches the browser. `task-list.tsx` starts with `"use client"`, so it also runs in the browser. That lets it use `useState` and respond to clicks and typing.

**2. Why do you validate on the server if the input already has `required` and `maxLength`?**
Browser checks are easy to get around: someone can edit the HTML or send a POST request directly to the Server Action. The server is the only place I control, so the real checks happen in `actions.ts`. The browser checks just give faster feedback.

**3. How does the page update after I add or delete a task?**
After changing the database, the action calls `refresh()`. Next.js re-renders the page on the server, `page.tsx` loads the tasks again, and the browser gets the new list in the same response as the action result. I never update the list by hand in the browser.

**4. Why is there a `globalThis` check in `lib/prisma.ts`?**
In development, Next.js reloads changed files, which would run `new PrismaClient()` again each time and open more and more database connections. Storing the client on `globalThis`, which survives reloads, means there is only ever one. In production the file runs only once, so the check isn't needed there.

**5. What would you add or change next?**
- User accounts, so each person only sees their own tasks. Every action would then also check that the task belongs to the user.
- A loading state on the buttons (for example with `useFormStatus`), so a slow request can't be clicked twice.
- Tests for the actions.
- Putting the filter in the URL so it survives a reload.
