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

## URL Parameters 
The URL parameters include ROI, date range, cloud cover threshold, selected band combination, and spectral index.

Parameter definitions:

- roi: defines the area of interest as an array of 4 coordinates, each representing a vertex of the polygon, [ [lon1, lat1], [lon2, lat2], [lon3, lat3], [lon4, lat4] ]
- startDate: start of the selected date range, yyyy-mm-ddThh:mm:ssZ 
- endDate: end of the selected date range, yyyy-mm-ddThh:mm:ssZ
- cloud: maximum cloud cover percentage, integer 
- band: selected spectral bands, array of strings
- index: selected spectral index, string

Example:
?roi=[[51.2,35.6],[51.5,35.6],[51.5,35.8],[51.2,35.8]]&startDate=2025-01-01T00:00:00Z&endDate=2025-10-31T23:59:59Z&cloud=10&band=[B8,B4]&index=ndvi


## Performance Budgets
To ensure the app loads quickly and provides a smooth user experience, the following performance budgets are set:
- Initial bundle size: ≤ 300 KB
The main JavaScript bundle should stay under 300 KB to minimize initial load time.

- External map/style tiles:
Map tiles and styles (MapLibre layers, satellite imagery) will be loaded from external servers rather than bundled with the app.

Goal: Fast initial loading (<2.5s) and responsive map interaction.

## Accessibility Goals
- Ensure logical keyboard navigation and tab order.
- Use correct ARIA roles and attributes for assistive technologies.
- Maintain visible focus and clear highlighting for elements when navigating via keyboard.
- Text and UI elements maintain sufficient contrast for readability.
- Form and input errors are communicated clearly via text and ARIA alerts.
- Supports browser zoom and font resizing without breaking layout.
- Images, charts, and icons include descriptive alt text or labels for screen readers.

Goal: Ensure the app is usable and navigable for all users, including those relying on assistive technologies.