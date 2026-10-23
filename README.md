# HealthKicks Frontend

Frontend web application for the **HealthKicks** connected IoT footwear stimulation, biomechanical analytics, and fall prevention system.

Built with **Angular 22** (Standalone components, Signals, Native control flow `@if` / `@for`, Lazy-loaded routes) and styled with modern **Tailwind CSS v4**. Tested with **Vitest**.

---

## Features

- **Public Landing Page**: Concept presentation, product highlights, and sign-in / sign-up call-to-actions.
- **Authentication & Security**:
  - Email + password authentication.
  - **Google SSO** & **Microsoft Entra ID (Azure AD)** OAuth2 integration with PKCE flow.
  - Automatic JWT token injection via HTTP interceptor (`Authorization: Bearer <token>`) with automatic token refresh, 401 handling, and session recovery.
- **Member Dashboard**:
  - **Device Management**: Real-time connectivity status (online/offline indicators), device selection with search, and factory-registered device binding.
  - **Haptic Control**: Remote haptic stimulation triggering (intensity 0–255, duration 50–10000 ms) with toast notifications.
  - **Fall Alerts & Emergency Contacts (`/dashboard/fall-alerts`)**:
    - **Emergency Contacts Management**: Priority-ordered emergency contacts (1..5), with support for both email and mobile phone numbers, instant drag/order priority reorganisation, inline phone/email edition, and one-click test email & test SMS dispatch.
    - **Fall Alert History**: Comprehensive paginated audit trail of all detected fall events, with state filtering (`PENDING`, `ESCALATING`, `ACKNOWLEDGED`, `CANCELLED`, `EXHAUSTED`, `SUPPRESSED`), date range selectors, GPS location display with Google Maps links, and detailed notification logs (email/SMS channels, timestamps, acknowledger identity).
  - **Activity Events & Step Tracking**: Real-time event log, interactive timeline, daily step counting charts with hourly breakdown, and monthly activity calendar.
  - **Studio Mode**: High-frequency IMU capture session runner with countdown, real-time vibration inspection graph (Chart.js), and AWS IoT command dispatch.
  - **Studio History**: Historical capture session explorer, RBAC filtering (admin vs. regular user), label curation with DynamoDB synchronization, and raw IMU waveform visualization.
  - **User Profile**: Account details, certified OIDC read-only email display, role badge, and profile update forms.
- **Public Fall Alert Acknowledgment Page (`/fall-alerts/ack`)**:
  - Accessible, mobile-first emergency page opened directly when a caregiver or family member clicks the link in an alert SMS or email.
  - Safe, read-only metadata retrieval (`GET /api/v1/fall-alerts/ack/info`) preventing premature state mutations by link scrapers or antivirus bots.
  - Explicit visual states:
    - **Loading Skeleton**: Fluid placeholder animation while verifying token.
    - **Pending Confirmation**: High-contrast emergency banner, patient details, detection time, fall type and confidence score, GPS position with Google Maps routing button, large touch-friendly button to confirm acknowledgment, and direct **Call 112** shortcut.
    - **Instant Success**: Green reassurance screen confirming the escalation has ceased and the patient's phone has received confirmation.
    - **Already Acknowledged**: Informs the user of the identity of the caregiver who already took charge.
    - **Patient Cancelled**: Reassuring notice indicating the patient got back up or cancelled the alert.
    - **Expired / Invalid**: Explains the 2-hour security window with an immediate emergency call button.
- **Internationalization (i18n)**: Runtime multi-language support (English and French) with automatic browser language detection fallback.
- **Theme Support**: Seamless dark/light theme switching with system preference detection and local persistence.

---

## Tech Stack

- **Framework**: Angular 22 (Standalone Architecture, Signals, Reactive Forms, Native Control Flow)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/postcss`)
- **Visualizations & 3D**: Chart.js & Three.js (interactive 3D shoe orientation viewer)
- **Unit Testing**: Vitest 5 (`@analogjs/vite-plugin-angular`, JSDOM)
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
  apiUrl: 'https://healthkicks.duckdns.org:8443',
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

To run a production configuration build directly via Angular CLI:

```bash
pnpm exec ng build --configuration production
```

---

## Testing

Run unit tests via **Vitest**:

```bash
# Single full run for all test suites:
pnpm test

# Interactive watch mode during development:
pnpm run test:watch
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
- Triggered automatically on `push` and `pull_request` (executes the Vitest test suite and builds the production bundle).
- On pushes to `main` (after tests and build pass):
  1. Builds the production Docker image.
  2. Pushes the image to **Amazon ECR** (`693906847467.dkr.ecr.eu-north-1.amazonaws.com/healthkicks-frontend:latest`).
  3. Deploys via SSH to the production EC2 host (`docker pull` and rolling container restart).

### Required Secrets (Production Environment)

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`
