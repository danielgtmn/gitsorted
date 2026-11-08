# Security Policy

gitsorted handles GitHub access tokens with permission to delete repositories,
so security reports are taken seriously.

## Reporting a vulnerability

Please **do not open a public issue.** Instead use
[GitHub private vulnerability reporting](https://github.com/danielgtmn/gitsorted/security/advisories/new)
or email **daniel@gietmanic.com**.

Please include steps to reproduce and the impact you see. You can expect an
initial response within a few days.

## Supported versions

Only the latest `main` (deployed at [gitsorted.eu](https://gitsorted.eu)) is
supported.

## Scope notes

- Tokens are stored only in encrypted, HTTP-only cookies; they are never
  written to a database.
- The optional stats database holds only anonymous totals and keyed hashes of
  GitHub user ids (see README → Privacy).
- All GitHub API calls run server-side; tokens never reach client JavaScript.
