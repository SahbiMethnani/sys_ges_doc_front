# DocRAG Frontend

Interface Angular pour le système RAG. Voir le [README racine](../README.md) pour lancer toute l'application.

## Docker (recommandé)

Le frontend est inclus dans le stack racine :

```powershell
cd c:\Users\hp\Bureau\PFE
docker compose up --build -d
```

Accès : http://localhost:4200

## Développement local

```powershell
npm install
npm start
```

API attendue sur `http://localhost:8000` (`src/environments/environment.ts`).

## Build image seule

```powershell
docker build -t rag-frontend:local --build-arg API_URL=http://localhost:8000 .
```
