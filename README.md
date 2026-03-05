# Kayo Security Scanner GitHub Action

A custom GitHub Action that runs the Kayo security scanner with privileged Docker access.

## Usage

### Required Inputs

| Input | Description |
|-------|-------------|
| `server-url` | Kayo server URL (e.g., `https://api.codexsecurity.io`) |
| `apikey` | Kayo API key for authentication |
| `project-name` | Kayo project name (e.g., `hanshal101/ecap`) |

### Optional Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `image-name` | Docker image name for the scanner | `kkyo` |

## Example Workflow

```yaml
name: Security Scan

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  kayo-scan:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run Kayo Security Scanner
        uses: ./path-to-action
        with:
          server-url: https://api.codexsecurity.io
          apikey: ${{ secrets.KAYO_API_KEY }}
          project-name: my-org/my-project
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the action:
   ```bash
   npm run build
   ```

3. Store your Kayo API key as a secret in your GitHub repository:
   - Go to Repository Settings → Secrets and variables → Actions
   - Add a new secret named `KAYO_API_KEY`

4. Reference the action in your workflow file

## Notes

- This action requires a runner with Docker support and sudo privileges
- The scanner runs with privileged access to scan the host system
- After the scanner completes, there is a 1-minute delay before the job continues
