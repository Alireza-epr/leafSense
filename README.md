## Methods

This application computes NDVI (Normalized Difference Vegetation Index) time series
from Sentinel-2 L2A data using STAC items and Cloud-Optimized GeoTIFFs (COGs).

For each scene:
- Red (B04) and NIR (B08) bands are read from GeoTIFFs.
- NDVI is computed per pixel using the formula:  
  NDVI = (NIR − Red) / (NIR + Red)
- Scene Classification Layer (SCL) is used to mask clouds, shadows, water, and invalid pixels.
- NDVI is aggregated over a point or polygon (zonal) using mean or median.
- Scenes below a minimum valid-pixel coverage threshold are excluded.
- Optional outlier rejection (IQR or z-score) and rolling-median smoothing can be applied.
- Results are assembled into a chronological time series and visualized.

## Parameters

The following parameters control data selection, filtering, and visualization:

- **AOI (Area of Interest)**: Point or polygon selected on the map.
- **Date range**: Start and end dates for STAC search.
- **Max cloud cover (%)**: Pre-filter scenes using STAC cloud cover metadata.
- **Coverage threshold (%)**: Minimum fraction of valid pixels required per scene.
- **Mode**: Point or zonal (polygon) sampling.
- **Aggregation**: Mean or median NDVI.
- **Outlier filter**: On/off (IQR or z-score based).
- **Smoothing window**: Rolling median window size (1 disables smoothing).
- **Change-point detection**: Enable/disable with sensitivity controls.

All parameters are persisted in the URL so the view can be restored via copy/paste.

## Limitations

- GeoTIFFs may use projected coordinate systems (e.g. UTM); map coordinates must be
  reprojected before pixel sampling.
- Zonal results depend on raster resolution (10 m vs 20 m); up/down-sampling can affect precision.
- Aggressive cloud masking or high coverage thresholds may remove many scenes.
- Outlier detection assumes reasonable temporal continuity and may misclassify abrupt but real changes.
- Client-side processing performance depends on AOI size and number of scenes.

## Masking Details

Cloud, shadow, and quality masking rules are documented separately.  
See: [`docs/data/masking.md`](docs/data/masking.md)

---

## Folder Structure

```js

/src
    /assets
    /components
    /hooks
    /lib
    /store
    /types
    /utils
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
- Jest + Playwright  
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
