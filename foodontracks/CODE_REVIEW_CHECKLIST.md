# Code Review Checklist

Before approving a PR, check:

- [ ] Branch name follows convention
- [ ] PR description explains purpose & testing steps
- [ ] Changes are scoped and small
- [ ] Code is readable and commented where necessary
- [ ] No console logs or commented debug code remain
- [ ] Linting and formatting pass (ESLint/Prettier)
- [ ] Tests added/updated for new logic (unit/integration)
- [ ] Security: no secrets, no accidental exposure of env vars (NEXT_PUBLIC_ rules)
- [ ] Dependencies updated responsibly (no dangerous upgrades)
- [ ] Performance: no obvious regressions
- [ ] Documentation (README or docs) updated if needed
- [ ] CI checks pass on PR