# ============================================================
# Stage 1: Build React application
# ============================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ============================================================
# Stage 2: Serve static assets via Nginx
#
# Note: VITE_* env vars (VITE_API_URL, VITE_REVERB_*) are
# baked in at build time by Vite. Pass them as Docker build
# args in the Jenkins pipeline for each environment.
# ============================================================
FROM nginx:alpine AS production

LABEL maintainer="ChefLogik"
LABEL description="ChefLogik Admin — React 18 / TypeScript / Vite"

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5600

CMD ["nginx", "-g", "daemon off;"]
