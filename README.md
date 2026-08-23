# X Clone

A full-stack social media application inspired by X/Twitter. Users can publish posts, upload images, follow people, reply to comments, repost content, save bookmarks, search the application, and receive live notification badges.

## Features

- Account registration and login with an HTTP-only JWT cookie
- One-time password recovery links delivered through Gmail
- API rate limiting with stricter protection for failed authentication attempts
- Role-based admin dashboard for statistics, user review, and content moderation
- For You and Following feeds
- Text and Cloudinary-hosted image posts
- Full-screen previews for post, profile, and cover images
- Editable and deletable owned posts, comments, and replies
- Post deletion with a confirmation dialog
- Likes, reposts, comments, and one-level reply threads
- Private bookmarks
- User profiles with editable profile/cover images and real follower counts
- Follow and unfollow actions with accurate button state
- Profile feeds containing both authored posts and reposts
- Case-insensitive search for people and post text
- Cursor pagination for posts, profile activity, comments, replies, bookmarks, and search
- Notifications for follows, likes, comments, replies, reposts, and new posts from followed users
- Live unread notification badges using Server-Sent Events (SSE)
- Responsive dark interface built with Tailwind CSS and daisyUI
- Custom 404 page for unknown routes

## Technology stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, React Router, TanStack Query |
| Styling | Tailwind CSS 4, daisyUI, React Icons |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| ORM | Prisma ORM 7 with the PostgreSQL driver adapter |
| Authentication | JSON Web Tokens stored in HTTP-only cookies |
| Images | Cloudinary |
| Live updates | Server-Sent Events |
| Tooling | Vite, ESLint, Nodemon |

## Architecture

```mermaid
flowchart LR
    Browser[React application<br/>localhost:3000]
    API[Express API<br/>localhost:5000]
    DB[(PostgreSQL)]
    Images[Cloudinary]
    Stream[Notification SSE stream]

    Browser -->|REST + JWT cookie| API
    API -->|Prisma Client| DB
    API -->|Upload/delete images| Images
    API --> Stream
    Stream -->|Unread counts and events| Browser
```

The Vite development server proxies requests beginning with `/api` to the Express server. In production, the frontend and API should be served behind the same domain or a reverse proxy that preserves cookie credentials and SSE connections.

## Prerequisites

- Node.js `20.19+` or `22.12+`
- npm
- A PostgreSQL database
- A Cloudinary account for post and profile image uploads

## Local setup

### 1. Install dependencies

Install the backend dependencies from the project root:

```bash
npm install
```

Install the frontend dependencies:

```bash
npm --prefix frontend install
```

### 2. Configure environment variables

Copy the provided [environment template](.env.example):

```bash
cp .env.example .env
```

Then replace its placeholders with your PostgreSQL, JWT, and Cloudinary values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"
JWT_SECRET="replace-with-a-long-random-secret"
NODE_ENV="development"
PORT=5000
CLIENT_URL="http://localhost:3000"
DOCKER_PORT=8080

CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

`NODE_ENV=development` is important when running locally. In any other mode, the authentication cookie is marked `secure` and therefore requires HTTPS.

Never commit `.env`; it is already excluded by `.gitignore`.

### 3. Prepare the database

Generate Prisma Client:

```bash
npm run db:generate
```

Apply the existing migrations:

```bash
npm run db:migrate
```

You can verify the migration state with:

```bash
npm run db:status
```

### 4. Start the application

Run the backend in one terminal:

```bash
npm run dev
```

Run the frontend in another terminal:

```bash
npm --prefix frontend run dev
```

Open [http://localhost:3000](http://localhost:3000). The API is available at [http://localhost:5000](http://localhost:5000).

## Docker

The repository includes a multi-stage `Dockerfile` and a Compose stack. The image builds the React frontend, generates Prisma Client, applies committed migrations, and serves the frontend and API from the same Express process. Compose also starts PostgreSQL with a persistent named volume.

### Start with Docker Compose

Make sure `.env` exists, then run:

```bash
docker compose up --build -d
```

Open [http://localhost:8080](http://localhost:8080). The health endpoint is available at [http://localhost:8080/api/health](http://localhost:8080/api/health).

The host port can be changed in `.env`:

```dotenv
DOCKER_PORT=8080
```

Useful commands:

```bash
# Show container health and port mappings
docker compose ps

# Follow application logs
docker compose logs -f app

# Stop the containers while preserving PostgreSQL data
docker compose down

# Stop containers and permanently delete the Docker database volume
docker compose down -v
```

The final command deletes all PostgreSQL data stored by this Compose project. Use it only when you intentionally want a clean database.

### Build only the application image

If PostgreSQL is already available elsewhere:

```bash
docker build -t twitter-clone .
docker run --rm -p 8080:5000 --env-file .env twitter-clone
```

For a standalone `docker run`, `DATABASE_URL` must be reachable from inside the container. On Docker Desktop, a database running on the host can normally be addressed through `host.docker.internal` instead of `localhost`.

### Should Docker changes be tested?

Docker files can be written without running them, but a runtime test is strongly recommended. A successful source build does not prove that the image has the right files, Prisma binaries, environment variables, network addresses, migrations, health checks, or cookie behavior. At minimum, run Compose and verify:

```bash
docker compose ps
curl http://localhost:8080/api/health
```

The app container runs `prisma migrate deploy` before Express starts. This applies existing migration files without creating migrations or resetting data.

## Available commands

### Backend and database

| Command | Description |
| --- | --- |
| `npm run dev` | Start Express with Nodemon |
| `npm start` | Start Express with Node.js |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Apply/create development migrations |
| `npm run db:status` | Show migration status |
| `npm run db:studio` | Open Prisma Studio |

### Frontend

| Command | Description |
| --- | --- |
| `npm --prefix frontend run dev` | Start Vite on port 3000 |
| `npm --prefix frontend run lint` | Run ESLint |
| `npm --prefix frontend run build` | Create a production build |
| `npm --prefix frontend run preview` | Preview the production build |

## Project structure

```text
twitter-clone/
├── Dockerfile               # Multi-stage application image
├── compose.yaml             # Application and PostgreSQL services
├── docker-entrypoint.sh     # Migration and server startup
├── backend/
│   ├── controllers/        # Request handlers
│   ├── db/                 # Prisma Client initialization
│   ├── middleware/         # JWT route protection
│   ├── routes/             # Express routers
│   ├── services/           # Cloudinary, post query, profile feed, and SSE logic
│   ├── utils/              # Shared pagination helpers
│   └── server.js           # Express application entry point
├── frontend/
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Shared UI components and skeletons
│       ├── hooks/          # Follow, profile update, and notification hooks
│       ├── lib/            # API and query-cache helpers
│       ├── pages/          # Route-level pages
│       └── utils/          # Date and display utilities
├── prisma/
│   ├── migrations/         # SQL migration history
│   └── schema.prisma       # Database schema
├── .env.example            # Safe local configuration template
├── prisma.config.ts        # Prisma CLI configuration
└── package.json            # Backend/database scripts and dependencies
```

## Data model

| Model | Purpose |
| --- | --- |
| `User` | Account, profile, image information, and `USER`/`ADMIN` role |
| `Post` | Text/image content and author ownership |
| `Comment` | Top-level comments and one-level replies through `parentId` |
| `Follow` | Follower/following relationships |
| `Like` | Unique user/post likes |
| `Repost` | Unique user/post reposts with activity timestamps |
| `Bookmark` | Private saved posts |
| `Notification` | Follow and post-related notification events |
| `PasswordResetToken` | Hashed, expiring, one-time account recovery tokens |

Deleting a user or post cascades through its related records. Notification types are `follow`, `like`, `comment`, `reply`, `repost`, and `post`.

## Authentication

Successful signup or login creates a cookie named `jwt`:

- HTTP-only to reduce exposure to client-side scripts
- `SameSite=Strict` for CSRF protection
- Valid for 15 days
- Secure outside development mode

Resetting or changing a password increments the account's token version, invalidating previously issued JWT cookies. Reset links expire after 15 minutes, are stored only as SHA-256 hashes, and can be used once.

All application endpoints except signup, login, logout, and the health check use the authentication middleware. Frontend API requests include credentials automatically.

New accounts always receive the `USER` role. There is intentionally no public endpoint for granting administrator access. After applying the migrations, promote a trusted account through the Neon SQL Editor or another PostgreSQL client:

```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'your-email@example.com';
```

Log out and back in, or refresh the application, after changing the role. Admin APIs enforce the role on the server; hiding the dashboard link in the frontend is only a user-interface convenience.

## API reference

The base API URL is `/api`. Unless stated otherwise, endpoints require the `jwt` cookie.

### System

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Public container/service health check |

### Authentication

| Method | Endpoint | Body | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | `fullName`, `username`, `email`, `password` | Create an account and authenticate |
| `POST` | `/api/auth/login` | `username`, `password` | Authenticate an existing account |
| `POST` | `/api/auth/forgot-password` | `email` | Request a one-time password reset email |
| `POST` | `/api/auth/reset-password/:token` | `password`, `confirmPassword` | Replace the password using a valid reset token |
| `POST` | `/api/auth/logout` | — | Clear the authentication cookie |
| `GET` | `/api/auth/me` | — | Return the authenticated user |

Passwords must contain at least six characters.

### Users

| Method | Endpoint | Body/query | Description |
| --- | --- | --- | --- |
| `GET` | `/api/users/profile/:username` | — | Get a profile, counts, and current follow state |
| `GET` | `/api/users/suggested` | — | Get up to ten accounts not currently followed |
| `POST` | `/api/users/follow/:id` | — | Toggle follow/unfollow for a user |
| `POST` | `/api/users/update` | Profile fields | Update the authenticated account |

Supported profile fields are `fullName`, `username`, `email`, `bio`, `link`, `currentPassword`, `newPassword`, `profileImg`, and `coverImg`. Images are submitted as browser-generated data URLs and uploaded to Cloudinary.

### Posts and feeds

| Method | Endpoint | Body/query | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts/all` | `cursor`, `limit` | Get the global feed |
| `GET` | `/api/posts/following` | `cursor`, `limit` | Get posts from followed users |
| `GET` | `/api/posts/user/:username` | `cursor`, `limit` | Get authored posts and repost activity for a profile |
| `GET` | `/api/posts/liked` | `cursor`, `limit` | Get posts liked by the authenticated user |
| `GET` | `/api/posts/bookmarks` | `cursor`, `limit` | Get private bookmarks |
| `GET` | `/api/posts/:id` | — | Get one post |
| `POST` | `/api/posts/create` | `text`, optional `img` | Create a post |
| `PATCH` | `/api/posts/:id` | `text` | Edit an owned post |
| `DELETE` | `/api/posts/:id` | — | Delete an owned post |
| `POST` | `/api/posts/like/:id` | — | Toggle a like |
| `POST` | `/api/posts/repost/:id` | — | Toggle a repost |
| `POST` | `/api/posts/bookmark/:id` | — | Toggle a bookmark |

A post must contain text or an image. Frontend post uploads are limited to 5 MB and sent as an image data URL.

### Comments and replies

| Method | Endpoint | Body/query | Description |
| --- | --- | --- | --- |
| `GET` | `/api/posts/:id/comments` | `cursor`, `limit` | Get top-level comments for a post |
| `POST` | `/api/posts/comment/:id` | `text` | Add a top-level comment |
| `PATCH` | `/api/posts/comments/:id` | `text` | Edit an owned comment or reply |
| `DELETE` | `/api/posts/comments/:id` | — | Delete an owned comment or reply |
| `GET` | `/api/posts/comments/:id/replies` | `cursor`, `limit` | Get replies for a top-level comment |
| `POST` | `/api/posts/comments/:id/replies` | `text` | Reply to a top-level comment |

Reply nesting is intentionally limited to one level.

### Search

| Method | Endpoint | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/api/search/users` | `q`, `cursor`, `limit` | Search full names and usernames |
| `GET` | `/api/search/posts` | `q`, `cursor`, `limit` | Search post text |

Search is case-insensitive. `q` must contain between 2 and 100 characters. User results include follower counts and the authenticated user’s follow state; post results use the same interactive response shape as the main feeds.

### Notifications

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/notifications` | Get notifications and mark unread items as read |
| `GET` | `/api/notifications/unread-count` | Get the unread count |
| `GET` | `/api/notifications/stream` | Open the authenticated SSE connection |
| `DELETE` | `/api/notifications` | Delete all received notifications |
| `DELETE` | `/api/notifications/:id` | Delete one received notification |

The server sends `notification` and `unread-count` SSE events. A heartbeat is written every 25 seconds, and the client reconnects automatically if the stream is interrupted.

### Administration

These endpoints require an authenticated user with the `ADMIN` role.

| Method | Endpoint | Query | Description |
| --- | --- | --- | --- |
| `GET` | `/api/admin/stats` | — | Get user, post, comment, and repost totals |
| `GET` | `/api/admin/users` | `q`, `cursor`, `limit` | Search and review users |
| `GET` | `/api/admin/posts` | `q`, `cursor`, `limit` | Search posts and author information |
| `GET` | `/api/admin/comments` | `q`, `cursor`, `limit` | Search comments and replies |
| `DELETE` | `/api/admin/posts/:id` | — | Permanently remove any post |
| `DELETE` | `/api/admin/comments/:id` | — | Permanently remove any comment or reply |

The frontend dashboard is available at `/admin`. Content removals require confirmation and are intentionally limited to posts, comments, and replies; user deletion and role management are not exposed in the interface.

## Pagination

Paginated endpoints accept:

| Parameter | Default | Range | Description |
| --- | --- | --- | --- |
| `limit` | `10` | `1–25` | Number of results per page |
| `cursor` | — | Endpoint cursor | Cursor returned by the previous response |

Feed-style responses use this shape:

```json
{
  "posts": [],
  "nextCursor": "cursor-or-null"
}
```

Comments, replies, users, and search results replace `posts` with their corresponding collection name. Pass `nextCursor` into the next request and stop when it is `null`.

Profile activity uses an opaque cursor because authored posts and reposts are merged by activity time. Clients should never parse or construct cursor values themselves.

## Notification behavior

Notifications are stored in PostgreSQL and pushed to connected clients through an in-memory SSE registry. The application avoids like, comment, reply, and repost notifications when the actor owns the relevant content. Creating a post generates a notification for each follower.

This design is intentionally simple and appropriate for a side project. Because SSE connections are stored in the backend process, a multi-instance deployment would need shared pub/sub—such as Redis—to deliver events reliably across instances.

## Image uploads

Post, avatar, and cover images are converted to data URLs in the browser and uploaded by the backend to Cloudinary. When replacing or deleting an image, the backend derives its Cloudinary public ID from the stored URL before removing the old asset.

For production, consider direct signed browser uploads to Cloudinary to avoid sending large base64 payloads through the API.

## Production notes

- Set `NODE_ENV=production` and serve the application over HTTPS.
- Use a strong, stable `JWT_SECRET`; changing it invalidates existing sessions.
- Set `CLIENT_URL` to the frontend origin when the frontend and API use different origins.
- Route `/api` and the SSE endpoint through the same public origin as the frontend, or configure credentialed cross-origin requests carefully.
- Disable proxy buffering for `/api/notifications/stream`.
- Apply migrations with `npx prisma migrate deploy` during deployment.
- Keep Cloudinary and database credentials in the deployment platform’s secret manager.
- Configure `GMAIL_USER`, `GMAIL_APP_PASSWORD`, and `EMAIL_FROM_NAME` as deployment secrets for password recovery.

## Troubleshooting

### Unable to reach the API

Confirm that the backend is running on port 5000:

```bash
npm run dev
```

### Docker cannot connect to the daemon

Start Docker Desktop or the system Docker service before running Compose. If the active context points to a stopped Docker Desktop daemon, inspect the available contexts and select the running one:

```bash
docker context ls
docker context use default
```

### Login succeeds but the browser remains logged out

For local HTTP development, verify that `.env` contains:

```dotenv
NODE_ENV="development"
```

Restart the backend after changing environment variables. Also confirm that the frontend is using port 3000 and that browser cookies are enabled.

### `invalid signature` from the route middleware

The JWT was created with a different `JWT_SECRET`. Clear the `jwt` browser cookie, restart the backend with the intended secret, and log in again.

### Prisma cannot connect

Check `DATABASE_URL`, confirm PostgreSQL is reachable, and run:

```bash
npm run db:status
```

### Image upload fails

Verify all three Cloudinary variables. Post images must be valid image data URLs and no larger than 5 MB in the frontend.

### Password reset email fails

Confirm that Gmail 2-Step Verification is enabled and `GMAIL_APP_PASSWORD` contains the 16-character App Password, not the normal Gmail password. Spaces in the displayed App Password may be omitted. Also verify that `CLIENT_URL` is the exact public frontend origin so email links open the correct application.

## Quality checks

Before committing changes, run:

```bash
npm --prefix frontend run lint
npm --prefix frontend run build
node --check backend/server.js
```

## License

This project uses the ISC license as declared in `package.json`.
