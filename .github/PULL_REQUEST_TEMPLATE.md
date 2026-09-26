## Description
A clear and concise description of what this pull request changes and why.

## Related issue
Closes #(issue number), if applicable.

## Area
- [ ] Frontend (`frontend/`)
- [ ] Backend (`backend/`)
- [ ] Workflows / deployment

## Type of change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Documentation update
- [ ] Refactor / cleanup

## How has this been tested?
Describe how you ran it (local backend + `npm run dev`, staging on `dev`) and which pages, roles (User / Operator / Admin) and API routes you checked.

## Checklist
- [ ] `npm run build:prod` in `frontend/` completes without errors
- [ ] `npx playwright test` in `frontend/` passes, if the change affects covered pages
- [ ] The backend starts with `npm run dev` and the affected API routes respond correctly
- [ ] No console errors in the browser
- [ ] No secrets or `.env` files committed, and no secrets in `VITE_` variables
- [ ] I have updated documentation where needed
