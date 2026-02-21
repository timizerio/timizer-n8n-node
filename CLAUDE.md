# CLAUDE.md

## Workflow

After making code modifications, always rebuild and restart the Docker container:

```bash
npm run build && docker compose down && docker compose up -d
```
