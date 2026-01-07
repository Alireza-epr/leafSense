# User Guide

## Overview
LeafSense lets you explore vegetation health using NDVI time-series derived from Sentinel-2 imagery. You can analyze NDVI at a single point or over an area (polygon), apply quality filters, smooth the signal, detect changes, and export results.

---

## 1. Map & AOI Selection

### Point mode
- Click on the map to select a single location.
- A small ROI (10 m²) is automatically created around the point.

### Zonal (polygon) mode
- Draw a polygon directly on the map.
- The polygon defines the Area of Interest (AOI) used for zonal statistics.

You can switch between **Point** and **Zonal** modes at any time.

---

## 2. Date Range & Scene Filters

### Date range
- Select start and end dates to limit the Sentinel-2 scenes used.

### Max cloud cover
- Use the cloud slider to exclude scenes with high global cloud coverage
  (based on STAC metadata).

### Coverage threshold
- Minimum percentage of valid (non-masked) pixels required inside the AOI.
- Scenes below this threshold are excluded automatically.

---

## 3. NDVI Computation

- NDVI is computed from Sentinel-2 surface reflectance:
  - Red band: **B04**
  - NIR band: **B08**
- Cloud, shadow, cirrus, and invalid pixels are masked using the **SCL** layer.
- For each scene the app computes:
  - Mean NDVI
  - Median NDVI
  - Number of valid pixels
  - Valid pixel fraction

---

## 4. Chart Controls

### Aggregation
- Toggle between **Mean NDVI** and **Median NDVI**.

### Smoothing
- Enable/disable smoothing.
- Rolling median window sizes (e.g. 3 or 5) reduce noise in the time series.

### Outlier filtering
- Toggle outlier rejection (IQR or Z-score).
- Helps remove abnormal NDVI values caused by residual clouds or artifacts.

### Tooltips
Hover over the chart to see:
- Date
- NDVI value
- Valid pixel percentage

---

## 5. Coverage Track

- A bar/area track below the NDVI chart shows valid pixel fraction per scene.
- Scenes below the coverage threshold are visually dimmed.

---

## 6. Provenance Panel

For each scene, the provenance panel lists:
- Acquisition date
- Valid pixel percentage
- Included / excluded status
- Reason for exclusion (e.g. cloud coverage, low valid fraction)

This ensures transparency and reproducibility.

---

## 7. Change-Point Detection

- Enable change-point detection to identify abrupt NDVI changes.
- Adjustable parameters:
  - Window size
  - Sensitivity (z-score / CUSUM threshold)
  - Minimum separation between detected events
- Detected change points are marked on the chart with tooltips.

---

## 8. Annotations

- Click near a date on the chart to add a short note (≤ 120 characters).
- Annotations are stored in client state and persisted in the URL.
- Annotations appear on the chart and in exports.

---

## 9. Export & Sharing

### CSV export
Exports:
- Date
- NDVI (raw)
- NDVI (smoothed, if enabled)
- Valid pixel fraction
- Scene ID

### PNG export
- Exports the chart with annotations and markers.
- Optimized for dark and light backgrounds.

### URL sharing
- The URL encodes:
  - AOI
  - Date range
  - Cloud & coverage thresholds
  - Outlier and smoothing settings
  - Mode (point / zonal)
- Copy/paste the URL to restore the exact same view.
