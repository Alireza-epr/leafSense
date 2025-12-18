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

---
# In-Memory Cache Documentation

This document describes the in-memory caching mechanisms used in the application.

---

## 1. Cache STAC Items

**Purpose:**  
Cache STAC (SpatioTemporal Asset Catalog) items to reduce repeated queries and improve performance.

**Cache Key:**  
The key for this cache is based on the **search parameters used to query STAC items**.  

---

## 2. Cache NDVI Calculations

**Purpose:**  
Cache NDVI (Normalized Difference Vegetation Index) calculation results to avoid redundant processing.

**Cache Key:**  
The key for this cache is based on:  
1. `item_id` – Unique identifier of the STAC item.  
2. `NDVI coverage threshold` – The threshold used for NDVI calculation.  
3. `Rejection Outlier type` – The type of outlier rejection applied.  

---

**Notes:**  
- Both caches are **in-memory** and are not persisted between application restarts.  
- Key composition must be consistent to avoid cache misses.  
- Consider cache size limits or eviction policies if memory usage is a concern.

---

## Demo

![Demo](./demo.gif)
