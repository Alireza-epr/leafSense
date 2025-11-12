# Architecture & stack decisions

## Stack
The app is built using **React + TypeScript** to ensure modularity and strong typing.
For the map component, **MapLibre GL JS** is chosen due to its open-source nature and strong support for different types of map data.
The NDVI time-series visualization uses **Recharts**, providing a lightweight and responsive charting solution.
The app is bundled with **Vite**, ensuring fast builds and efficient development.
**Zustand** handles global state management for simplicity and performance.

## Testing Strategy
The app uses three complementary testing tools:

- Jest, for unit tests.
Testing individual functions.

- React Testing Library (RTL), for component tests.
Ensuring React components render correctly.

- Playwright, for end-to-end (E2E) tests.
Simulating real user workflows in the browser.