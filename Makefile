.PHONY: dev down test test-contracts test-engine test-platform build-web seed schemas

dev:            ## Start the full stack (postgres, redis, minio, engine, platform, web)
	docker compose -f infra/docker-compose.yml up --build

down:
	docker compose -f infra/docker-compose.yml down

test: test-contracts test-engine test-platform  ## Run all backend tests

test-contracts:
	cd packages/contracts && ../../.venv/bin/pytest tests -q

test-engine:
	cd apps/ai-engine && ../../.venv/bin/pytest -q

test-platform:
	cd apps/platform && ../../.venv/bin/pytest -q

build-web:
	cd apps/web && npm run build

schemas:        ## Export contract JSON Schemas
	.venv/bin/python -m tender_contracts.export_schemas packages/contracts/schemas/v1

venv:           ## Create local venv with all backend packages (editable)
	python3 -m venv .venv
	.venv/bin/pip install -e packages/contracts -e "apps/ai-engine[dev]" -e "apps/platform[dev]"
