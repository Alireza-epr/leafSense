# Compute NDVI from Sentinel-2 B08 and B04 Bands

This guide explains how to use B08 (NIR) and B04 (Red) to compute NDVI.

---

## Understanding Bands

Each band contains:

```ts
const band8 = { href: "...B08_10m.tif", ... }
const band4 = { href: "...B04_10m.tif", ... }
```

- `href` → file path
- metadata like projection, wavelength, etc.

---

## Step 1 – Get the HTTPS link

```ts
const B8_URL = band8.href;
const B4_URL = band4.href;
```

These URLs let **download the actual JP2 image files**.

---

## Step 2 – Attach Token to URL

```ts
const b8SignedURL = `${B8_URL}?${token}`;

```
---

## Step 3 – Decode using `geotiff.js`

```ts
import { fromUrl } from "geotiff";

// Load B08
const tiff8 = await fromUrl(b8SignedURL);
const image8 = await tiff8.getImage();
const pixels8 = await image8.readRasters({ window });

// Load B04
const tiff4 = await fromUrl(b2SignedURL);
const image4 = await tiff4.getImage();
const pixels4 = await image4.readRasters({ window });
```

### Explanation of each step

| Code | What it does (very simple) |
|------|-----------------------------|
| `fromUrl(b8SignedURL)` | Convert raw file bytes → readable GeoTIFF object |
| `tiff8.getImage()` | Open the image inside the file |
| `image8.readRasters({ window })` | Extract all pixel values in the given window as a number array |

After this step, `pixels8` and `pixels4` contain the **actual reflectance values** - Each index corresponds to a single pixel in the image.
The value is the reflectance or intensity for that pixel (not color, unless it’s an RGB image).
Example:
- For Sentinel-2, this number shows how much sunlight the ground reflected in that wavelength.

```js
pixels8[0]   // value of the first pixel (top-left)
pixels8[1]   // value of the second pixel
...
pixels8[width * row + col] // value of pixel at row, col
```

---

### What is a GeoTIFF object?

A **GeoTIFF object** is:

- A **JavaScript representation of the satellite image**  
- Allows reading **metadata** (width, height, projection)  
- Allows reading **pixel values** for calculations  

Analogy:

- Before: raw JP2 bytes → like a locked file  
- After: GeoTIFF object → like opening a folder

Without it, it is not possible computing NDVI because JavaScript cannot understand raw JP2 bytes.

---

## Step 4 – Compute NDVI

NDVI formula:

```
NDVI = (NIR - RED) / (NIR + RED)
```

TypeScript code:

```ts
const nir = pixels8[0]; // B08
const red = pixels4[0]; // B04

const ndvi = new Float32Array(nir.length);

for (let i = 0; i < nir.length; i++) {
    ndvi[i] = (nir[i] - red[i]) / (nir[i] + red[i] || 1);
}
```

- `ndvi` is now an array of NDVI values for each pixel.  
- Values range from `-1` (water/low vegetation) to `1` (dense vegetation).

### Sentinel-2 JP2 Pixel Values – Unit Explanation

When working with Sentinel-2 L2A `.jp2` band files, each pixel has a numeric value representing **reflectance**. Here's how to understand it:

---

## 1. Unit

- Sentinel-2 L2A images **store reflectance values scaled by 10,000**.  
- To get the actual reflectance (fraction of sunlight reflected):

```
actual reflectance = pixel value / 10000
```

- Example:

| Pixel value | Actual reflectance |
|-------------|------------------|
| 4523        | 0.4523           |
| 9800        | 0.98             |
| 1200        | 0.12             |

- **Reflectance** is **unitless** and ranges from 0 to 1:
  - `0` → no reflection (very dark)  
  - `1` → full reflection (very bright)

---

## 2. Interpreting “High” or “Low”

| Pixel value | Reflectance | Meaning                        |
|-------------|------------|--------------------------------|
| 0           | 0          | Very dark surface (water, shadow) |
| 2000        | 0.2        | Dark surface                    |
| 4523        | 0.4523     | Medium brightness (soil, vegetation) |
| 7000        | 0.7        | Bright surface                  |
| 10000       | 1          | Very bright surface (snow, clouds) |

- **Low numbers** → dark areas  
- **High numbers** → bright areas

---

## 3. Notes

- Each Sentinel-2 **band** represents reflectance in a specific wavelength (e.g., B04 = red, B08 = near-infrared).  
- To visualize or process the image, the pixel values are often **scaled or normalized**.


---

## Step 5 – Optional: Save or Visualize NDVI

We can save it as GeoTIFF or render it as a PNG or visualize on a map:

```ts
// Example: save NDVI array as GeoTIFF
import GeoTIFF from "geotiff";

const ndviTiff = await GeoTIFF.writeArrayBuffer({
    data: ndvi,
    width: image8.getWidth(),
    height: image8.getHeight()
});
```

---

## Summary

1. Get **HTTPS URLs** from your objects  
2. Download JP2 files as **ArrayBuffers**  
3. Convert bytes → **GeoTIFF objects** using `geotiff.js`  
4. Extract pixel arrays using `readRasters()`  
5. Compute NDVI using `(B08 - B04) / (B08 + B04)`  

The GeoTIFF object is the key to turning unreadable satellite files into numbers you can calculate with.


