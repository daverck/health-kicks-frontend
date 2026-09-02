# HealthKicksApp

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.27.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.

---

# Health Kicks — Documentation projet

Application frontend Angular pour le système IoT de stimulation connectée **Health Kicks**.

## Stack

- **Angular 19** (Standalone Components, Signals, routes lazy-loaded)
- **Tailwind CSS 3**
- **pnpm** comme gestionnaire de paquets

## Configuration

L'API backend est configurée dans `src/environments/environment.ts` :

```ts
apiUrl: 'http://healthkicks.duckdns.org:8000'
```

Pensez à y définir aussi `googleClientId` pour le SSO Google.

## Développement

```bash
pnpm install
pnpm start        # http://localhost:4200
```

## Build production

```bash
pnpm exec ng build --configuration production
# sortie : dist/health-kicks-app/browser
```

## Fonctionnalités

- **Landing page publique** : présentation du concept, CTA Connexion / Inscription.
- **Authentification** : email + mot de passe, **Google SSO** (OAuth2 via le backend
  `/api/v1/auth/google/login` et callback géré par `/auth/google/callback` côté SPA).
- **AuthInterceptor** : injection du JWT (`Authorization: Bearer <token>`) sur chaque
  requête API + redirection `/login` sur 401.
- **Espace Membre** (protégé par `authGuard`) :
  - Profil utilisateur : consultation et édition.
  - Contrôle IoT : sélection du device, déclenchement haptique à distance
    (intensité 0–255, durée 50–10000 ms) avec toast de confirmation.
  - Historique des événements/chutes : timeline + tableau paginé, avec
    **fallback mock** (`MockApiService`) si l'endpoint backend
    `/devices/{id}/events/falls` n'est pas encore disponible.

## Docker

```bash
docker build -t healthkicks-frontend .
docker run -p 8080:8080 healthkicks-frontend
# http://localhost:8080
```

Image multi-stage : build Angular via Node 20 + pnpm, service via **Nginx Alpine**
avec fallback SPA (`try_files $uri $uri/ /index.html`).

## Déploiement CI/CD

`.github/workflows/deploy.yml` — déclenchement **manuel** (`workflow_dispatch`),
environment **production**. Étapes : build image Docker → push ECR
(`693906847467.dkr.ecr.eu-north-1.amazonaws.com/healthkicks-frontend:latest`) →
SSH sur l'EC2 pour `docker pull` + relance du conteneur (port 8080).

Secrets requis (environment `production`) :
`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.
