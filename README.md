# HealthKicks Frontend

Frontend web application for the **HealthKicks** connected IoT footwear stimulation and fall prevention system.

Built with **Angular 19** (Standalone components, Signals, Lazy-loaded routes) and styled with **Tailwind CSS** & **Angular Material**.

---

## Features

- **Public Landing Page**: Concept presentation, product highlights, and sign-in / sign-up call-to-actions.
- **Authentication & Security**:
  - Email + password authentication.
  - **Google SSO** & **Microsoft Entra ID (Azure AD)** OAuth2 integration via backend API.
  - Automatic JWT token injection via HTTP interceptor (`Authorization: Bearer <token>`) with 401 handling & automatic redirection.
- **Member Dashboard**:
  - **Device Management**: Real-time connectivity status (online/offline indicators), device selection with search, and factory-registered device binding.
  - **Haptic Control**: Remote haptic stimulation triggering (intensity 0–255, duration 50–10000 ms) with toast notifications.
  - **Fall Events & Timeline**: Real-time event log, interactive timeline, and paginated event table.
  - **Studio Mode**: High-frequency IMU capture session runner with countdown, real-time vibration inspection graph (Chart.js), and AWS IoT command dispatch.
  - **Studio History**: Historical capture session explorer, RBAC filtering (admin vs. regular user), label curation with DynamoDB synchronization, and raw IMU waveform visualization.
  - **User Profile**: Account details, certified OIDC read-only email display, role badge, and profile update forms.
- **Internationalization (i18n)**: Runtime multi-language support (English and French) with automatic browser language detection fallback.

---

## Tech Stack

- **Framework**: Angular 19 (Standalone Architecture, Signals, Reactive Forms)
- **Styling**: Tailwind CSS 3 & Angular Material
- **Charts**: Chart.js with Angular integration
- **Package Manager**: pnpm

---

## Getting Started

### Prerequisites

- Node.js 22+ (or 24+)
- [pnpm](https://pnpm.io/) 9+

### Installation

```bash
pnpm install
```

### Environment Configuration

The backend API URL is configured in `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'https://healthkicks.duckdns.org',
};
```

For local backend development, update `apiUrl` to `http://localhost:8000`.

### Development Server

Run the development server on `http://localhost:4200/`:

```bash
pnpm start
# or: ng serve
```

The application will automatically reload if you change any source files.

---

## Building

To build the project for production:

```bash
pnpm run build
# Output directory: dist/health-kicks-app/browser
```

---

## Testing

### Unit Tests

Run unit tests via Karma:

```bash
# Interactive watch mode:
pnpm test

# Single headless run for CI / automated testing:
pnpm run test:ci
```

---

## Docker

A multi-stage Dockerfile is provided (Angular build with Node + pnpm, served via **Nginx Alpine** with SPA fallback routing):

```bash
# Build the Docker image:
docker build -t healthkicks-frontend .

# Run the container locally on port 8080:
docker run -d -p 8080:8080 --name healthkicks-frontend healthkicks-frontend
```

Open `http://localhost:8080/` in your browser.

---

## CI/CD Deployment

The GitHub Actions workflow is defined in `.github/workflows/deploy.yml`:
- Triggered automatically on `push` and `pull_request` (runs unit tests via Karma headless).
- On pushes to `main` (after tests pass):
  1. Builds the production Docker image.
  2. Pushes the image to **Amazon ECR** (`693906847467.dkr.ecr.eu-north-1.amazonaws.com/healthkicks-frontend:latest`).
  3. Deploys via SSH to the production EC2 host (`docker pull` and rolling container restart).

### Required Secrets (Production Environment)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

