# Contributing

Thanks for your interest in contributing to this project.

## Reporting bugs

Open a [GitHub issue](https://github.com/BenSuskins/wedding/issues) with a clear description of the problem, steps to reproduce, and what you expected to happen.

## Proposing features

Open an issue first to discuss the idea before writing code. This avoids wasted effort if the feature doesn't fit the project's scope.

## Development setup

See the [README](README.md) for local dev setup instructions.

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your changes, keeping commits focused and the test suite green (`pnpm test`, `pnpm typecheck`, `pnpm lint`).
3. Open a PR against `main` with a clear description of what and why.

## Code style

- TypeScript throughout — no `any` unless genuinely unavoidable.
- Follow the patterns already in the codebase (result types via `neverthrow`, fakes over mocks in tests, functional style where practical).
- No comments that describe *what* the code does — only *why* when it's non-obvious.
