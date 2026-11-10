<div align="center">

# Treba Frontend

### Marketplace interface · Buyer account · Admin workspace

[Українська](README.md) · **English**

<img src="https://skillicons.dev/icons?i=nextjs,react,ts,css&theme=dark" height="44" alt="Next.js, React, TypeScript and CSS">

<br>

![Next.js](https://img.shields.io/badge/Next.js-16-111827?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-149ECA?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Containers-2496ED?style=flat-square&logo=docker&logoColor=white)

[![Source](https://img.shields.io/badge/SOURCE-002AFF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/tr3ba/treba-frontend)
[![Backend](https://img.shields.io/badge/BACKEND-FF6E2A?style=for-the-badge&logo=dotnet&logoColor=white)](https://github.com/tr3ba/treba-backend)
[![Project](https://img.shields.io/badge/PROJECT-002AFF?style=for-the-badge&logo=github&logoColor=white)](https://github.com/tr3ba/.github/blob/main/profile/README.md)

</div>

[Overview](#overview) · [Stack](#stack) · [API and state](#api-and-state) · [Run locally](#run-locally) · [Checks](#checks) · [Delivery](#docker-and-delivery)

## Overview

Treba Frontend is the Next.js interface for the marketplace. It includes the storefront, buyer flows, seller tools, and administrative workspace. It communicates with a separate backend API.

| For buyers | For sellers and staff |
|---|---|
| Catalog, search, product pages, gallery, and comparison | Admin workspace at <code>/admin</code> |
| Registration, sign-in, and password recovery | Seller applications and import tools |
| Cart, checkout, order cancellation, and delivery choices | Product, review, and support moderation |
| Wishlist, reviews, and private support | Ukrainian and English admin interface |

The storefront, buyer account, and admin workspace use different API routes. The table below shows which state comes from the backend and what remains in the browser.

<a id="stack"></a>
## Stack

| Component | Version or configuration |
|---|---|
| Next.js | <code>16.2.12</code> |
| React and React DOM | <code>19.2.4</code> |
| TypeScript | <code>^5</code> in package.json |
| Styles | CSS and CSS modules |
| ESLint | <code>^9</code>, with <code>eslint-config-next 16.2.12</code> |
| Node.js in frontend CI | <code>22</code> |
| Node.js in Docker | <code>24-alpine</code> |

[package.json](https://github.com/tr3ba/treba-frontend/blob/main/package.json) · [Frontend Checks](https://github.com/tr3ba/treba-frontend/blob/main/.github/workflows/check-frontend.yml) · [Dockerfile](https://github.com/tr3ba/treba-frontend/blob/main/docker/Dockerfile.frontend)

<a id="api-and-state"></a>
## API and state

~~~mermaid
flowchart LR
    USER["User"] --> UI["Next.js / React"]
    UI -->|"Catalog"| API["ASP.NET Core API"]
    UI -->|"Session, cart, orders"| PROXY["Next.js shop-api"]
    PROXY --> API
    ADMIN["/admin workspace"] --> STAFF["admin-api"]
    STAFF --> API
    style UI fill:#002AFF,color:#ffffff,stroke:#002AFF
    style PROXY fill:#002AFF,color:#ffffff,stroke:#002AFF
    style API fill:#FF6E2A,color:#ffffff,stroke:#FF6E2A
~~~

| Flow | Where state lives |
|---|---|
| Products and categories | Backend API through <code>src/lib/api</code> modules |
| Buyer session | Next.js routes and HttpOnly cookies; the backend validates credentials |
| Signed-in cart | <code>/shop-api/cart</code> proxies to the backend |
| Guest cart | Browser until sign-in |
| Orders | Authenticated Next.js routes proxy to the API; [buyer cancellation](https://github.com/tr3ba/treba-frontend/pull/56) was added later |
| Viewed products | Browser localStorage |
| Comparison | Catalog selections and client-side lists; a backend list API remains a TODO |

Session cookies use HttpOnly and SameSite, plus Secure in production. In <code>products.ts</code>, some recommendation sections use the first 100 returned products, so their contents depend on API ordering.

[Catalog API code](https://github.com/tr3ba/treba-frontend/blob/main/src/lib/api/products.ts) · [Cart context](https://github.com/tr3ba/treba-frontend/blob/main/src/context/CartContext.tsx) · [Session code](https://github.com/tr3ba/treba-frontend/blob/main/src/lib/server/session.ts)

<a id="run-locally"></a>
## Run locally

Run these commands from the root of <code>tr3ba/treba-frontend</code>. Use Node.js/npm and a reachable backend when testing API flows.

~~~powershell
npm ci
Copy-Item .env.example .env.local
~~~

For a backend running on port 5000, set these values in <code>.env.local</code>:

~~~dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000
TREBA_API_URL=http://localhost:5000
TREBA_STORE_ORIGIN=http://localhost:3000
~~~

| Variable | Role |
|---|---|
| <code>NEXT_PUBLIC_API_URL</code> | Public API URL for modules that read it |
| <code>TREBA_API_URL</code> | Backend URL for server-side session and proxy code |
| <code>TREBA_STORE_ORIGIN</code> | Storefront origin for server-side flows |
| <code>DEV_ALLOWED_ORIGINS</code> | Optional access to the development server from other devices |

The [server session module](https://github.com/tr3ba/treba-frontend/blob/main/src/lib/server/session.ts) checks <code>TREBA_API_URL</code>, then <code>NEXT_PUBLIC_API_URL</code>, then its deployed fallback. Set local addresses explicitly. Variables beginning with <code>NEXT_PUBLIC_</code> are included in the client build; keep server secrets out of them.

~~~powershell
npm run dev
~~~

Storefront: [localhost:3000](http://localhost:3000). Admin workspace: [localhost:3000/admin](http://localhost:3000/admin). Opening the admin route does not grant permissions; roles and authentication are enforced by the backend.

To check a production build locally:

~~~powershell
npm run build
npm run start
~~~

<a id="checks"></a>
## Checks

| Command | Purpose |
|---|---|
| <code>npm run lint</code> | ESLint script |
| <code>npx tsc --noEmit</code> | TypeScript check |
| <code>npm run build</code> | Next.js build |
| <code>node --test tests/*.test.mjs</code> | Node tests used by the workflow |
| <code>python3 -m unittest discover -s tests -p 'test_*.py'</code> | Python tests used by the workflow |

The package has no <code>npm test</code> script. [Frontend Checks](https://github.com/tr3ba/treba-frontend/blob/main/.github/workflows/check-frontend.yml) runs dependency installation, TypeScript, build, Node tests, and Python unittest. The lint script exists separately.

<a id="docker-and-delivery"></a>
## Docker and delivery

The Dockerfile has <code>deps</code>, <code>builder</code>, and <code>runner</code> stages. The runtime uses Node.js 24 Alpine on port 3000.

~~~powershell
docker build -f docker/Dockerfile.frontend --build-arg NEXT_PUBLIC_API_URL=http://localhost:5000 -t treba-frontend:local .
~~~

Server-side proxy routes also need <code>TREBA_API_URL</code> pointing to a backend reachable **from inside the container**. <code>localhost</code> inside a container refers to that container. <code>NEXT_PUBLIC_*</code> values are set at build time.

~~~text
Frontend Checks
       ↓
Storefront and workspace checks → Docker image → Amazon ECR
       ↓
AWS Systems Manager → candidate container → EC2 checks
~~~

The [publish workflow](https://github.com/tr3ba/treba-frontend/blob/main/.github/workflows/docker-publish.yml) pushes the image, and the [deployment workflow](https://github.com/tr3ba/treba-frontend/blob/main/.github/workflows/deploy-frontend.yml) checks a candidate container while retaining the previous one for rollback. Kubernetes Stage 5 remains a separate local track.

## Project layout

~~~text
src/
├── app/          Next.js pages and server routes
├── components/   interface components
├── context/      client-side state
└── lib/          API modules and server helpers

docker/           Dockerfile.frontend
tests/            Node and Python checks
.github/workflows/ CI, publishing, and delivery
~~~

[Admin workspace](https://github.com/tr3ba/treba-frontend/blob/main/docs/admin-workspace.md) · [Registration verification](https://github.com/tr3ba/treba-frontend/blob/main/docs/registration-verification.md) · [External sign-in](https://github.com/tr3ba/treba-frontend/blob/main/docs/external-authentication.md) · [Marketplace flows](https://github.com/tr3ba/treba-frontend/blob/main/docs/marketplace-workflows.md)

[Backend README](https://github.com/tr3ba/treba-backend/blob/main/README.en.md) · [Treba history](https://github.com/tr3ba/.github/blob/main/docs/history/project-history.en.md) · [Team](https://github.com/tr3ba/.github/blob/main/docs/team/README.en.md)
