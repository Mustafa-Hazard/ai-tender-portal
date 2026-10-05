# Git Workflow

## Rules

1. `main` is always working. Never commit directly to it.
2. One branch per change, created from an up-to-date `main`.
3. Every change reaches `main` through a Pull Request.
4. Merge method: **squash and merge**, so each PR becomes one clean commit on `main`.
5. Every PR that changes behaviour adds a line to `CHANGELOG.md` under `[Unreleased]`.
6. Never commit secrets, `.env` files, or tender/company documents.

## Branch names

    feat/<short-name>      new feature          feat/auth-jwt
    fix/<short-name>       bug fix              fix/deadline-timezone
    docs/<short-name>      documentation        docs/api-readme
    refactor/<short-name>  no behaviour change  refactor/tender-service
    test/<short-name>      tests only           test/compliance-edge-cases
    chore/<short-name>     tooling, deps        chore/upgrade-fastapi
    hotfix/<short-name>    urgent production fix

## Commit messages (Conventional Commits)

    <type>(<scope>): <summary in imperative mood>

    Optional body explaining WHY.

Examples:

    feat(api): add requirements matrix endpoints
    fix(api): reject naive datetimes for deadlines
    docs(product): update brief to v1.1

Breaking change: add `!` after the type, e.g. `feat(api)!: change tender id format`.

## Versioning

Semantic Versioning, tagged on `main`: `v0.2.0`. While below 1.0, minor bumps may include breaking changes.

## Releasing

1. Move `[Unreleased]` entries in `CHANGELOG.md` under a new version heading with today's date.
2. Commit via PR: `chore: release v0.2.0`.
3. Tag `main`: `git tag -a v0.2.0 -m "v0.2.0" && git push --tags`.
