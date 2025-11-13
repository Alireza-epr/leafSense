## Project

This project is part of a coaching assignment.  
It demonstrates a modern TypeScript + React setup with testing, CI/CD, and clean code structure.

---

## Folder Structure

```js

/src
    /components
    /features/map
    /features/series
    /lib
/public
/tests
/e2e
/docs

```
---

## Scripts

| Command | Description |
|----------|--------------|
| `npm run dev` | Start development server |
| `npm run build` | Build project for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier formatting |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Run unit tests (Jest) |
| `npm run e2e` | Run end-to-end tests (Playwright) |

---

## CI/CD

This repository uses **GitHub Actions** to automatically:
1. Install dependencies  
2. Run lint and unit/E2E tests  
3. Build the project  
4. Deploy when merged into `master`

---

## Tech Stack

- TypeScript  
- React  
- ESLint + Prettier  
- Jest + RTL + Playwright  
- GitHub Actions CI/CD  

