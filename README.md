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

## Tests

Les tests unitaires du frontend sont exécutés avec Vitest.

Vitest est utilisé comme runner de tests  léger et rapide, même si `ng test` reste la commande classique d’Angular CLI. Ici, nous avons choisi d’utiliser explicitement les commandes Vitest pour garantir une exécution claire et reproductible des tests unitaires :

- `npm run test:unit` pour lancer les tests en ligne de commande
- `npm run test:html` pour générer un rapport HTML
- `npm run test:unit -- --ui` pour ouvrir l’interface graphique Vitest

Ce choix permet de montrer dans le rapport PFE que le projet intègre à la fois une exécution automatisée et une interface utilisateur dédiée pour l’analyse des résultats.

### Commandes principales

```powershell
npm run test:unit
npm run test:html
npm run test:unit -- --ui
```

- `npm run test:unit` : lance les tests unitaires en ligne de commande.
- `npm run test:html` : génère un rapport HTML dans le dossier `html/`.
- `npm run test:unit -- --ui` : ouvre l’interface graphique Vitest dans le navigateur.

### Tests réalisés

Les tests actuels couvrent le service `RagService` situé dans `src/app/shared/services/rag.service.ts` et vérifient :

- la création du service
- la requête de statut (`getStatus`)
- l’envoi d’une question au backend (`query`)
- l’affichage de la liste de documents (`listDocuments`)
- l’upload de document (`uploadDocument`)
- l’indexation des documents (`indexDocuments`)
- la suppression de document (`deleteDocument`)
- la propagation des erreurs HTTP

Ces tests utilisent des mocks pour `HttpClient` afin de simuler les appels HTTP sans serveur réel.

### Vitest UI

Pour voir l’interface graphique de Vitest :

```powershell
npm run test:unit -- --ui
```

Un navigateur s’ouvrira sur l’URL affichée dans le terminal, où tu peux lancer, filtrer et consulter les résultats de test.

### Rapport HTML

Après `npm run test:html`, ouvre le rapport généré avec :

```powershell
npx vite preview --outDir html
```

Puis ouvre l’URL indiquée dans le navigateur.

## Build image seule

```powershell
docker build -t rag-frontend:local --build-arg API_URL=http://localhost:8000 .
```
