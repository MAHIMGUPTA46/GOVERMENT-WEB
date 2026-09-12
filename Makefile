.PHONY: help up down restart migrate seed test lint clean

help:
	@echo "PAIMANA AI Infrastructure Database & Backend Commands:"
	@echo "  make up          - Start all Docker containers (Postgres, Redis, Backend, Frontend)"
	@echo "  make down        - Stop all containers"
	@echo "  make migrate     - Run Alembic database migrations"
	@echo "  make seed        - Run Python database seeder (105 projects, 1,260 snapshots)"
	@echo "  make test        - Run backend test suite with Pytest"
	@echo "  make logs        - Follow Docker container logs"

up:
	docker-compose up -d --build

down:
	docker-compose down

restart:
	docker-compose restart

migrate:
	docker-compose exec backend alembic upgrade head

seed:
	docker-compose exec backend python -m app.db.seed

test:
	docker-compose exec backend pytest -v apps/api/tests/

logs:
	docker-compose logs -f
