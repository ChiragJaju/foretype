# Local entry points. `make bootstrap` once after cloning; `make verify` before you push.
.PHONY: bootstrap verify verify-fast doctor format lint test site-dev

bootstrap:
	npm ci
	cd site && npm ci
	git config core.hooksPath .githooks
	@if command -v brew >/dev/null 2>&1; then brew bundle --file=Brewfile; \
	else echo "Install swiftlint, gitleaks and xcodegen (Homebrew: brew bundle --file=Brewfile)."; fi
	@./scripts/doctor.sh

verify:
	node scripts/verify.mjs

verify-fast:
	node scripts/verify.mjs --changed --tier fast

doctor:
	@./scripts/doctor.sh

format:
	npm run format

lint:
	swiftlint lint --strict --quiet
	npm run format:check
	cd site && npm run lint

test:
	app/scripts/test.sh

site-dev:
	cd site && npm run dev
