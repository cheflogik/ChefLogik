WEB_IMAGE := cheflogik-web-img
WEB_CONTAINER := cheflogik-web

API_IMAGE := cheflogik-api-img
API_CONTAINER := cheflogik-api

ADMIN_IMAGE := cheflogik-admin-img
ADMIN_CONTAINER := cheflogik-admin

LANDING_IMAGE := cheflogik-admin-img
LANDING_CONTAINER := cheflogik-admin


# ── Backend API  ────────────────────────────────────────────────────
api-build: ## Build frontend docker image
	cd api && docker build -t $(API_IMAGE) .

api-run: ## Build frontend docker image
	cd api && docker run --name $(API_CONTAINER) --network shared_network --env-file ./.env.docker -d -p 8000:8000 $(API_IMAGE)

api-stop: ## Stop and remove the frontend container
	docker stop $(API_CONTAINER) && docker rm $(API_CONTAINER)

api-restart: api-stop api-build api-run

api-shell: ## Open a bash shell in the app container
	cd api && docker exec -it $(API_CONTAINER) sh



# ── Frontend  ────────────────────────────────────────────────────
web-build: ## Build frontend docker image
	cd web && docker build -t $(WEB_IMAGE) .

web-run: ## Run frontend container (nginx on port 5500)
	cd web && docker run --name $(WEB_CONTAINER) --network shared_network --env-file ./.env -d -p 5500:5500 $(WEB_IMAGE)

web-stop: ## Stop and remove the frontend container
	docker stop $(WEB_CONTAINER) && docker rm $(WEB_CONTAINER)

web-restart: web-stop web-build web-run ## Stop, rebuild, and restart the frontend container

web-shell: ## Open a bash shell in the app container
	docker exec -it $(WEB_CONTAINER) sh



# ── Admin Dashboard  ────────────────────────────────────────────────────
admin-build: ## Build frontend docker image
	cd admin && docker build -t $(ADMIN_IMAGE) .

admin-run: ## Build frontend docker image
	cd admin && docker run --name $(ADMIN_CONTAINER) --network shared_network --env-file ./.env -d -p 5600:5600 $(ADMIN_IMAGE)

admin-stop: ## Stop and remove the frontend container
	docker stop $(ADMIN_CONTAINER) && docker rm $(ADMIN_CONTAINER)

admin-restart: admin-stop admin-build admin-run

admin-shell: ## Open a bash shell in the app container
	cd admin && docker exec -it $(ADMIN_CONTAINER) bash



# ── Kubernetes  ────────────────────────────────────────────────────
api-shell-kube:
	kubectl exec -it -n cheflogik-api-staging $(kubectl get pods -n cheflogik-api-staging -l app=cheflogik-api -o name) -- /bin/sh

web-shell-kube:
	kubectl exec -it -n cheflogik-web-staging $(kubectl get pods -n cheflogik-web-staging -l app=cheflogik-web -o name) -- /bin/bash

admin-shell-kube:
	kubectl exec -it -n cheflogik-admin-staging $(kubectl get pods -n cheflogik-admin-staging -l app=cheflogik-admin -o name) -- /bin/bash



# ── Landing  ───────────────────────────────────────────────────────
landing-build: ## Build frontend docker image
	cd admin && docker build -t $(LANDING_IMAGE) .

landing-run: ## Build frontend docker image
	cd admin && docker run --name $(LANDING_CONTAINER) --network shared_network --env-file ./.env -d -p 5600:5600 $(LANDING_IMAGE)

landing-stop: ## Stop and remove the frontend container
	docker stop $(LANDING_CONTAINER) && docker rm $(LANDING_CONTAINER)

landing-restart: landing-stop landing-build landing-run

landing-shell: ## Open a bash shell in the app container
	cd admin && docker exec -it $(LANDING_CONTAINER) bash