# Interview Notes – Task Manager

A small task manager built with Next.js 16 (App Router), TypeScript, Tailwind CSS,
Prisma and MySQL, with Google sign-in through Auth.js. Each user signs in with
Google and can add, complete, edit, delete and filter **their own** tasks.

## What each file does

**My code files**

| File | What it does |
| --- | --- |
| `prisma/schema.prisma` | Describes the database: `Task`, plus the `User`, `Account` and `Session` models Auth.js needs. Each task has a `userId` that points to its owner. Prisma uses this file to create migrations and to generate a typed client. |
| `lib/prisma.ts` | Creates one shared Prisma Client that talks to MySQL. In development it is saved on `globalThis` so hot reloads don't keep opening new database connections. |
| `auth.ts` | Sets up Auth.js: Google as the only sign-in provider, and the Prisma adapter so users and sessions are saved in MySQL. It exports `auth()` (who is signed in?), `signIn` and `signOut`. |
| `app/api/auth/[...nextauth]/route.ts` | Two lines that give Auth.js its own URLs, such as `/api/auth/callback/google`, where Google sends the user back after signing in. |
| `app/page.tsx` | The only page. It calls `auth()`: signed out, it shows the landing page; signed in, it shows the tasks. |
| `app/landing-page.tsx` | The landing page: the app name, a short description and the "Sign in with Google" button. |
| `app/tasks-view.tsx` | What a signed-in user sees: "Signed in as {name}", the Sign out button and the task list. It loads only that user's tasks. I put it in its own file so `page.tsx` stays short and only decides which view to show. |
| `app/task-list.tsx` | A Client Component with the add form, the filter buttons, the "tasks left" count and the task rows (including editing). It uses small helper components inside the file. |
| `app/actions.ts` | The Server Actions: `createTask`, `updateTask`, `toggleTask` and `deleteTask`. Each one checks who is signed in, checks the input, only touches that user's tasks, and calls `refresh()` so the page shows the new data. |

**Supporting files**

- `prisma.config.ts`: settings for the Prisma CLI (where the schema and migrations are, and the database URL). Prisma 7 requires this file.
- `prisma/migrations/`: the SQL Prisma generated. `init` creates `Task`; `add_auth` adds the user tables and `Task.userId`.
- `.env` (not in git) holds `DATABASE_URL`, `AUTH_SECRET`, `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`. `.env.example` lists them without values.
- `app/layout.tsx`: I only changed the page title.

## The sign-in flow

From clicking the button to seeing my tasks:

1. Signed out, `page.tsx` calls `auth()`, finds no session, and shows the landing page.
2. I click **Sign in with Google**. The form calls the `handleSignIn` Server Action, which runs `signIn("google", { redirectTo: "/" })` on the server.
3. Auth.js saves two things in short-lived cookies: where to send me afterwards ("/"), and a random check value (called PKCE) that makes sure the reply from Google belongs to this sign-in. Then it redirects my browser to Google's sign-in page.
4. I choose my Google account and agree. Google redirects me back to `/api/auth/callback/google?code=...`.
5. On the server, Auth.js sends that one-time `code` to Google, together with my app's `AUTH_GOOGLE_SECRET`, and gets my profile back: name, email, photo and Google user id. This happens server to server, so the secret never reaches the browser.
6. Using the Prisma adapter, Auth.js looks for an `Account` row with `provider = "google"` and my Google id.
   - **First sign-in:** it creates a `User` row and an `Account` row.
   - **Later sign-ins:** it finds my existing user.
7. Auth.js creates a `Session` row with a long random `sessionToken` and an expiry date. It puts that token in an **HttpOnly** cookie (`authjs.session-token`), which JavaScript in the browser can't read.
8. Auth.js redirects me to "/". `page.tsx` calls `auth()` again. Auth.js reads the cookie, finds the `Session` row and its `User`, and the `session` callback in `auth.ts` adds my user id. Now there is a user, so the page shows `TasksView` with my tasks.

**Signing out:** the `handleSignOut` Server Action calls `signOut({ redirectTo: "/" })`. Auth.js deletes the `Session` row and clears the cookie, so "/" shows the landing page again.

## How tasks are linked to users

- **Primary keys** (the unique id of each row):
  - `Task.id` is an autoincrement `Int` (1, 2, 3...).
  - `User.id` is a text `cuid()` such as `"cmh3k9..."`, because Auth.js works with text ids.
- **Foreign key:** `Task.userId` holds the `id` of the user who owns the task. In the schema:
  ```prisma
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  ```
  - MySQL enforces it: a task can't point to a user that doesn't exist.
  - `onDelete: Cascade` means deleting a user also deletes all their tasks, so there are no orphan tasks.
- **It's a one-to-many relation:** one user has many tasks (`tasks Task[]` on `User`), and each task has exactly one user.
- **Every query filters by the signed-in user's id:**
  - Reading: `findMany({ where: { userId } })` in `tasks-view.tsx`.
  - Changing: `where: { id, userId }` in the actions.

## Why there's no proxy.ts, and why the checks are in the actions

`proxy.ts` (called `middleware.ts` before Next.js 16) runs before a request reaches a page. Its usual job in an app like this is to **redirect** signed-out users away from private pages.

**This app doesn't need one.** There is only one page, "/", and it already decides what to show: `page.tsx` calls `auth()` and shows the landing page or the tasks. There is no private page to redirect away from.

**The real protection is the `auth()` checks on the server:**

- **In the page:** signed out, `page.tsx` never renders `TasksView`, so no tasks are loaded. Signed in, `TasksView` only loads tasks where `userId` is the signed-in user's id.
- **In every Server Action:** a Server Action is a public POST endpoint. Anyone can call it directly with a tool like `curl`, without clicking my buttons, so a redirect in a proxy would never stop them. That's why each action:
  1. calls `getUserId()`, which uses `auth()` to read the session cookie on the server. If nobody is signed in, it stops.
  2. never takes a user id from the browser. The id only comes from the session, so it can't be faked.
  3. adds `userId` to the `where` of every query (`where: { id, userId }`). If I send the id of someone else's task, nothing matches and nothing changes.

Even if I added a `proxy.ts` later (for example with more pages), these checks would stay. The Next.js docs say Proxy should only be used for quick "optimistic" redirects, not as the real security check.

**How I tested it:** with two test users, user A tried to toggle, edit and delete user B's task, and a signed-out request tried the same. B's task was unchanged every time.

## What happens when I add a task

1. I type a title and click **Add**. The browser first checks `required` and `maxLength={100}`, and stops the submit if they fail.
2. The `<form action={handleSubmit}>` in `AddTaskForm` calls `handleSubmit` with the form data.
3. `handleSubmit` calls `createTask(formData)`. It looks like a normal function call, but because `createTask` is a Server Action, Next.js sends it to the server as a POST request. The browser sends the session cookie with it automatically.
4. On the server, `createTask` calls `getUserId()`. If nobody is signed in, it returns "You must be signed in."
5. It reads and trims the title and checks it with `validateTitle` (not empty, at most 100 characters). If it is invalid, it returns an error message.
6. If it is valid, `prisma.task.create({ data: { title, userId } })` inserts a new row into the MySQL `Task` table, owned by me. MySQL gives it the next id. `completed` defaults to `false`, and `createdAt` and `updatedAt` are filled in automatically (because of `@default(now())` and `@updatedAt` in the schema).
7. `refresh()` tells Next.js to re-render the page. `page.tsx` and `TasksView` run again on the server and load my tasks, now including the new one.
8. The server sends back the result (`null`, meaning "no error") together with the updated page, in one response.
9. In the browser, React shows the new list and `handleSubmit` clears any old error. React also resets the form, so the input is empty again.

## Key decisions

| Decision | Why | One alternative |
| --- | --- | --- |
| **Server Actions** instead of API routes | Less code: there are no URLs, `fetch` calls or JSON handling to write. I call a function and Next.js handles the request. They also work with normal HTML forms. | **Route Handlers** (`app/api/tasks/route.ts`) with `fetch` from the client. That's better if other apps, such as a mobile app, need to use the same API. |
| **Prisma** as the database tool | The schema is easy to read, it creates the migrations for me, and its queries are type-safe, so TypeScript knows a task has a `title`. I don't write SQL by hand. | **Drizzle ORM**, or plain SQL with the `mysql2` package. |
| **Autoincrement `Int` ids** for tasks | Simple, small and easy to read (1, 2, 3...). MySQL creates them for me. They are easy to guess, but that's fine here because every query also checks `userId`, so knowing a task's id doesn't let you change it. | **UUIDs or CUIDs** (`String @default(cuid())`), like `User.id`. They're harder to guess and can be created without asking the database. |
| **Validation on the server** (in `actions.ts`), plus simple browser checks | Anyone can send a request straight to a Server Action, so the server must check everything. The browser checks (`required`, `maxLength`) are only for quick feedback. The database column is also `VarChar(100)`, a final safety net. | A validation library such as **Zod**, which is useful when there are many fields. Here two if-checks were enough. |
| **Auth.js with Google** | I don't store or check passwords myself, which is the riskiest part of building logins. Auth.js handles the OAuth steps, the cookies and the sessions, and its Prisma adapter saves users in my existing database. | **Clerk** (a hosted login service), or **email and password** with hashed passwords, which is a lot more code to get right. |
| **Database sessions** (the default with an adapter) | The cookie only holds a random token, and the session lives in the `Session` table. Signing out deletes the row, so the session really ends, and I can see sessions in the database. | **JWT sessions** (`session: { strategy: "jwt" }`): the user info lives in a signed cookie, so no database lookup is needed, but a session can't be cancelled before it expires. |
| **One page** that shows the landing page or the tasks | Simpler: there is no second page, no redirects and no `proxy.ts`. After sign-in and sign-out the user always ends up on "/". | A separate `/tasks` page, protected with `proxy.ts` plus an `auth()` check on the page. |
| **Filter in `useState`** in the browser | The filter only changes what is shown, not the data, so there is no need to ask the server. Switching is instant. | Put the filter in the URL (`?filter=active`) and filter in the database query. Then the filter survives a page reload and can be shared as a link. |
| **`refresh()`** after each change | Next.js 16 recommends it for refreshing the page when the data isn't cached. | `revalidatePath("/")`, the older and well-known way. |
| **`<Suspense>`** in `page.tsx` | This project has Next.js **Cache Components** turned on, so Next.js builds a static "shell" of the page at build time. Who is signed in is only known when someone visits, so the `auth()` part is wrapped in `<Suspense>`, which shows "Loading..." until it's ready. (Before sign-in existed I also needed `await io()`, because Prisma reads the current time. Now `auth()` reads the cookie first, which already marks the page as request-time, so `io()` isn't needed.) | Turn Cache Components off in `next.config.ts`. Then the page is simply rendered on every request, without Suspense. |

## Likely interview questions

**1. What's the difference between `page.tsx` and `task-list.tsx`?**
`page.tsx` is a Server Component: it runs only on the server, so it can safely read the session and the database, and its code never reaches the browser. `task-list.tsx` starts with `"use client"`, so it also runs in the browser. That lets it use `useState` and respond to clicks and typing.

**2. Why do you validate on the server if the input already has `required` and `maxLength`?**
Browser checks are easy to get around: someone can edit the HTML or send a POST request directly to the Server Action. The server is the only place I control, so the real checks happen in `actions.ts`. The browser checks just give faster feedback.

**3. How does the page update after I add or delete a task?**
After changing the database, the action calls `refresh()`. Next.js re-renders the page on the server, loads my tasks again, and the browser gets the new list in the same response as the action result. I never update the list by hand in the browser.

**4. Why is there a `globalThis` check in `lib/prisma.ts`?**
In development, Next.js reloads changed files, which would run `new PrismaClient()` again each time and open more and more database connections. Storing the client on `globalThis`, which survives reloads, means there is only ever one. In production the file runs only once, so the check isn't needed there.

**5. What would you add or change next?**
- A loading state on the buttons (for example with `useFormStatus`), so a slow request can't be clicked twice.
- Tests for the actions, especially the "can't touch someone else's task" checks.
- Putting the filter in the URL so it survives a reload.

### Authentication questions

**6. Could a user change someone else's task by sending a different task id?**
No. The task id comes from the browser, but the user id doesn't: it comes from the session cookie, checked by `auth()` on the server. Every query uses `where: { id, userId }`, so for someone else's task nothing matches and nothing changes. I tested this with two users.

**7. What's in the session cookie, and why can't someone fake it?**
Only a long random `sessionToken`, with no name, email or id in it. On each request, Auth.js looks the token up in the `Session` table to find the user. Guessing another user's token is practically impossible. The cookie is also **HttpOnly**, so JavaScript on the page can't read it. `AUTH_SECRET` protects the other cookies Auth.js uses during sign-in.

**8. Why do you check `auth()` in every Server Action when the page already checks it?**
The page check only controls what is *shown*. A Server Action is a public POST endpoint that anyone can call directly with a tool like `curl`, without opening my page. So each action has to check, on its own, who is signed in and whether they own the task. That's also why a `proxy.ts` redirect alone would never be enough.
