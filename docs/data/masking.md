# Cloud, Shadow, and Outlier Masking

This document describes the NDVI masking and quality-control pipeline, including:
- Sentinel‑2 SCL class filtering
- Pixel validity rules
- Coverage threshold logic
- Outlier rejection (IQR & Z‑score)
- Threshold choices and trade‑offs

---

## 1. Masking (Cloud, Shadow, Water) with SCL

We use the Sentinel-2 L2A `SCL` (Scene Classification Layer) asset to filter out invalid pixels.  
This raster contains one class code per pixel: clouds, shadows, snow, vegetation, water, etc.

Masked classes:
|  Value | Class Name               | Meaning                             |
| -----: | ------------------------ | ----------------------------------- |
|  **0** | NO_DATA                  | Invalid data / outside image        |
|  **1** | SATURATED_OR_DEFECTIVE   | Sensor saturated or defective pixel |
|  **2** | DARK_FEATURES            | Shadows or very dark surfaces       |
|  **3** | CLOUD_SHADOWS            | Cloud shadows                       |
|  **4** | VEGETATION               | Healthy vegetation                  |
|  **5** | NOT_VEGETATED            | Soil / rocks / built-up             |
|  **6** | WATER                    | Water bodies                        |
|  **7** | UNCLASSIFIED             | No classification available         |
|  **8** | CLOUD_MEDIUM_PROBABILITY | Possible clouds (medium confidence) |
|  **9** | CLOUD_HIGH_PROBABILITY   | Highly probable clouds              |
| **10** | THIN_CIRRUS              | High thin cirrus clouds             |
| **11** | SNOW                     | Snow or ice                         |

### SCL classes and handling
- 0  NO_DATA                         → EXCLUDE
- 1  SATURATED_OR_DEFECTIVE          → EXCLUDE
- 2  DARK_FEATURES                   → KEEP
- 3  CLOUD_SHADOWS                   → EXCLUDE
- 4  VEGETATION                      → KEEP
- 5  NOT_VEGETATED (soil/bare)       → KEEP
- 6  WATER                           → EXCLUDE
- 7  UNCLASSIFIED                    → KEEP
- 8  CLOUD_MEDIUM_PROBABILITY        → EXCLUDE
- 9  CLOUD_HIGH_PROBABILITY          → EXCLUDE
- 10 THIN_CIRRUS                     → EXCLUDE
- 11 SNOW_OR_ICE                     → KEEP

Notes:
- If SCL is missing for an item, we skip masking.

### Implementation notes
- SCL is normally 20 m resolution; we *upsample* SCL to 10 m (nearest-neighbor / 2×2 repeat) to align with B04/B08 before masking.

---

## 2. Coverage Threshold
To ensure enough valid data exists in the scene, a **coverage threshold** is used.

### Computation
```
valid_percentage = valid_pixel_count / total_pixel_count * 100
```

### Requirement
A scene is accepted only if:
```
valid_percentage ≥ coverage_threshold
```
Default value: **70%**.

### Reasoning
- Too many masked pixels --> NDVI becomes unreliable.
- Scenes below threshold are removed from the time series.

---

## 3. Outlier Rejection
A small fraction of valid pixels can still produce abnormal NDVI values.

To fix this, the user can apply following outlier filtering.


### 1. IQR‑Based Outlier Filtering
The Interquartile Range (IQR) method detects values that are too low or too high.

### Procedure
1. Sort NDVI values.
2. Compute **Q1** (25th percentile) and **Q3** (75th percentile).
3. Compute **IQR = Q3 – Q1**.
4. Compute bounds:
```
low  = Q1 − 1.5 × IQR
high = Q3 + 1.5 × IQR
```
5. Keep NDVI only if:
```
low ≤ ndvi ≤ high
```

---

### 2. Z‑Score Outlier Filtering
The Z‑score method detects values far away from the mean.

### Procedure
1. Remove `NaN` values.
2. Compute **mean** and **standard deviation**.
3. For each NDVI value, compute Z‑score:
```
z = (ndvi − mean) / std
```
4. Reject if:
```
|z| > threshold
```
Default threshold: **2.0**.

---

## 6. Trade‑offs & Threshold Choices
### Coverage threshold (default 70%)
- **Higher** → more accurate scenes, fewer total scenes
- **Lower** → more scenes but noisier NDVI

### Outlier detection
| Method | Strengths | Weaknesses |
|--------|-----------|------------|
| IQR | Very robust | More computation, depends on percentiles |
| Z‑score | Works well on large datasets | Sensitive to non-normal data |









