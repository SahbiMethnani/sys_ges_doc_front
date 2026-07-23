# Stage 1 — Build Angular
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG API_URL=http://localhost:8000
RUN sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.prod.ts \
    && sed -i "s|http://localhost:8000|${API_URL}|g" src/environments/environment.ts

RUN npm run build -- --configuration production

# Stage 2 — Nginx
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/rag-frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
