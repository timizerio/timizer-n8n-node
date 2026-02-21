# CLAUDE.md

## Project

This is a community node for [n8n](https://n8n.io) that integrates with **Timizer**, a timesheet/CRA (Compte Rendu d'Activité) management application.

API documentation: https://api-doc.timizer.io/

## Workflow

After making code modifications, always rebuild and restart the Docker container:

```bash
npm run build && docker compose down && docker compose up -d
```
