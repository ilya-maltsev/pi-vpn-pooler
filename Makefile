CONTAINER_ENGINE := docker
TAG := pooler

DJANGO_SECRET := $(shell cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 50 | head -n 1)
DB_PASSWORD := $(shell cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

SSL_SUBJECT := "/C=DE/ST=SomeState/L=SomeCity/O=VPNPooler/OU=reverseproxy/CN=localhost"

.PHONY: cert secrets dev stack build clean distclean logs shell migrate help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

cert: ## Generate self-signed SSL certificates
	@openssl req -x509 -newkey rsa:4096 \
		-keyout templates/pi.key \
		-out templates/pi.pem \
		-sha256 -days 3650 -nodes \
		-subj $(SSL_SUBJECT) 2>/dev/null
	@echo "Certificate generation done: templates/pi.pem, templates/pi.key"

secrets: ## Generate random secrets for environment file
	@echo "Generate new secrets for environment file"
	@echo "-----------------------------------------"
	@echo "DJANGO_SECRET_KEY=$(DJANGO_SECRET)"
	@echo "DB_PASSWORD=$(DB_PASSWORD)"
	@echo "-----------------------------------------"
	@echo "Replace these values in environment/application-prod.env"

build: ## Build Docker image
	${CONTAINER_ENGINE} compose build

dev: ## Start development stack (runserver + hot-reload)
	${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml up -d
	@echo
	@echo "VPN Pooler dev: http://localhost:5000"

stack: cert ## Start production stack (gunicorn + nginx SSL)
	${CONTAINER_ENGINE} compose --env-file=environment/application-${TAG}.env -p ${TAG} up -d
	@echo
	@echo "VPN Pooler: https://localhost:$$(grep -oP 'PROXY_PORT=\K.*' environment/application-${TAG}.env 2>/dev/null || echo 5443)"

stop: ## Stop production stack
	${CONTAINER_ENGINE} compose -p ${TAG} down

stop-dev: ## Stop development stack
	${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml down

logs: ## Show production app logs
	${CONTAINER_ENGINE} compose -p ${TAG} logs -f app

logs-dev: ## Show development app logs
	${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml logs -f app

shell: ## Open Django shell in dev container
	${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml exec app python manage.py shell

migrate: ## Run migrations in dev container
	${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml exec app python manage.py migrate

clean: ## Stop and remove containers (preserves volumes)
	@${CONTAINER_ENGINE} compose -p ${TAG} down 2>/dev/null || true
	@${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml down 2>/dev/null || true

distclean: ## Remove containers AND volumes (data loss!)
	@echo -n "Warning! This will remove all data volumes. Are you sure? [y/N] " && \
		read ans && if [ $${ans:-'N'} = 'y' ]; then \
			${CONTAINER_ENGINE} compose -p ${TAG} down -v 2>/dev/null || true; \
			${CONTAINER_ENGINE} compose -f docker-compose.dev.yaml down -v 2>/dev/null || true; \
			echo "Containers and volumes removed."; \
		fi
