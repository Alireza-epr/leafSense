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

The URL parameters define the area of interest (ROI), temporal range, filtering thresholds, and processing options.

### ROI Parameters

You can specify the area of interest using a point-based ROI, a zonal (polygon) ROI, or both simultaneously.

#### 1) `point-roi`
Defines a circular ROI around a single point.

**Format**:
```
point-roi = [ [lon, lat], radius ]
```
- `lon`, `lat`: longitude and latitude of the center point
- `radius`: radius around the point (in meters)

**Example (decoded)**:
```
point-roi=[[7.463714645476074,51.366522261452275],50]
```

**URL-encoded**:
```
point-roi=%5B%5B7.463714645476074%2C51.366522261452275%5D%2C100%5D
```

---

#### 2) `zonal-roi`
Defines polygonal ROIs using multiple vertices.

**Format**:
```
zonal-roi-1 = [ [lon1, lat1], [lon2, lat2], [lon3, lat3], [lon4, lat4] ]
```

**Example (decoded)**:
```
zonal-roi-1=[
  [7.463714645476074,51.366522261452275],
  [7.466654346556197,51.36654905504389],
  [7.466611431211817,51.36500839803321],
  [7.4642510872788534,51.36437872329046]
]
```

**URL-encoded**:
```
?zonal-roi=%5B%5B7.463714645476074%2C51.366522261452275%5D%2C%5B7.466654346556197%2C51.36654905504389%5D%2C%5B7.466611431211817%2C51.36500839803321%5D%2C%5B7.4642510872788534%2C51.36437872329046%5D%5D
```

---

### Temporal Parameters

- `startdate`: start of the selected date range
- `enddate`: end of the selected date range

**Format**:
```
yyyy-mm-ddThh:mm:ss
```

**Example**:
```
startdate=2025-10-01T00:00:00
enddate=2025-12-15T00:00:00
```

**URL-encoded**:
```
?startdate=2025-10-01T00%3A00%3A00&enddate=2025-12-15T00%3A00%3A00

```

Note: The temporal operation will be set accordingly if it is not given.

---

### Spatial Operator

- `spatialop`: spatial relationship used for filtering

**Supported values**:
- `contains`
- `intersects`
- `within`
- `crosses`
- `disjoint`
- `equals`
- `overlaps`
- `touches`

**Example**:
```
spatialop=within
```

---
### Temporal Operator

- `temporalop`: temporal relationship used for filtering

**Supported values**:
- `during`
- `after start`
- `before end`

**Example**:
```
temporalop=during
```
---

### Quality & Coverage Filters

- `cloud`: maximum cloud cover percentage (integer 0 - 100)
- `snow`: maximum snow cover percentage (integer 0 - 100)
- `coverage`: minimum scene coverage percentage (integer 0 - 100)
- `limit`: maximum number of returned results (integer 1 - 50)

**Example**:
```
cloud=33&snow=44&coverage=70&limit=22
```

---

### Additional Options

- `annotations`: note assiged to a specific STAC scene
  - Values: {
    featureId: string, 
    datetime: string,
    note: string // Up to 120 char
  }
- `filter`: additional predefined filter
  - Values: `none | z-score | iqr`
- `smoothing`: enable or disable smoothing
  - Values: `true | false`

**Example**:
```
filter=none
smoothing=false
annotations=[{"note":"sample text","featureId":"S2A_MSIL2A_20251226T103501_R108_T32ULC_20251226T115008","datetime":"2025-12-26T10:35:01.024000Z"}]
```

---

### Full Example

```
?point-roi=%5B%5B7.463714645476074%2C51.366522261452275%5D%2C50%5D
&zonal-roi-1=%5B%5B7.463714645476074%2C51.366522261452275%5D%2C%5B7.466654346556197%2C51.36654905504389%5D%2C%5B7.466611431211817%2C51.36500839803321%5D%2C%5B7.4642510872788534%2C51.36437872329046%5D%5D
&startdate=2025-10-01T00%3A00%3A00
&enddate=2025-12-15T00%3A00%3A00
&spatialop=within
&temporalop=after%20start
&cloud=33
&snow=44
&coverage=70
&limit=22
&filter=z-score
&smoothing=true

```




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