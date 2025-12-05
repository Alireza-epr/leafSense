# Cloud, Shadow, and Outlier Masking

This document describes the NDVI masking and quality-control pipeline, including:
- Sentinel‑2 SCL class filtering
- Pixel validity rules
- Coverage threshold logic
- Outlier rejection (IQR & Z‑score)
- Threshold choices and trade‑offs

---

## 1. SCL‑Based Masking
Sentinel‑2 Scene Classification Layer (SCL) provides per‑pixel class codes. The following classes are **excluded** from NDVI calculations.

### Masked SCL Classes (removed pixels)
| Code | Meaning |
|------|---------|
| 3 | Cloud shadows |
| 6 | WATER |
| 8 | Medium probability clouds |
| 9 | High probability clouds |
| 10 | Thin cirrus |

### Valid Pixel Definition
A pixel is considered **valid** if:
- It is not in any excluded SCL class
- NDVI is a finite number (`!isNaN(ndvi) && isFinite(ndvi)`)

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









