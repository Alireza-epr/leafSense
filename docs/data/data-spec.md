# Data Specifications

## Sensor
After comparing various sensors, Sentinel-2 L2A was selected due to its free availability, moderate revisit time, and sufficient spatial resolution for vegetation monitoring.

## Index and bands
The project uses the Normalized Difference Vegetation Index (NDVI) to assess vegetation health, Calculated as:
```js
NDVI = (NIR-Red) / (NIR+Red)
```
NDVI values range from -1 to +1, with higher values indicating healthier vegetation.

For Sentinel-2 L2A, Band 8 (NIR) and Band 4 (Red) are used.
Band 8A (20 m) may serve as an alternative NIR source.

| **Band Name**    | **Description**                                       | **Resolution** |
| ---------------- | ----------------------------------------------------- | -------------- |
| B4 - 640–670 nm  | Red                                                   | 10 meters      |
| B8 - 785–900 nm  | Near Infrared (NIR)                                   | 10 meters      |
| B8A - 855–875 nm | Narrow NIR (alternative for NIR, more specific range) | 20 meters      |

So, for NDVI calculation:
```js
NDVI = (B8-B4) / (B8+B4)
```
or sometimes:
```js
NDVI = (B8A-B4) / (B8A+B4)
```
Note: Band 8A (20 m) can be used as an alternative NIR band for higher spectral precision, especially in areas with mixed vegetation, while Band 8 (10 m) is sufficient for standard NDVI calculations.

## Cloud Strategy
Product QA Layer is used for cloud masking. 
Reasons for choosing QA Layer:
 - High accuracy using satellite algorithms
 - Fast and easy to implement
 - Consistent masking across all images

Sentinel-2 L2A provides a built-in QA layer to identify clouds, shadows, water, and clear pixels, ensuring accurate NDVI calculations.
This ensures that only clear pixels are used for vegetation analysis, improving reliability.

## AOIs

| **Name**                        | **Rationale**                                                                      | **Bounding Box (lat/lon)** | **Screenshot**                                       |
| ------------------------------- | ---------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| **Hyrcanian Forests**           | Dense forest in northern Iran, ideal for testing NDVI in healthy, thick vegetation | 36.54, 52.76, 36.67, 51.38 | ![Screenshot](./AOIs/Hyrcanian_forests.png)          |
| **Tehran**                      | Capital city, mainly built-up area, low vegetation; test NDVI in urban environment | 35.61, 51.18, 35.82, 51.50 | ![Screenshot](./AOIs/Tehran.png)                     |
| **Fars Province**               | Agricultural land in southern Iran, seasonal crops, moderate NDVI                  | 29.90, 52.5, 29.95, 52.85  | ![Screenshot](./AOIs/Fars_province.png)              |

## STAC API
API Name: Copernicus Data Space Ecosystem STAC API

Base URL: https://stac.dataspace.copernicus.eu/v1

Protocol: POST

Key Endpoints:
- collections
- conformance
- search: offers more flexibility compared to the query extension
- queryables

Query Parameters (via /search):
- id
- datetime
- geometry
- platform
- grid:code
- published
- eo:snow_cover
- eo:cloud_cover
- sat:orbit_state
- processing:version
- sat:relative_orbit

Key Extensions: 
- collections
- filter
- query
- fields 
- sort

Ref: 
- https://documentation.dataspace.copernicus.eu/APIs/newSTACcatalogue.html#stac-api-extensions
- https://stac.dataspace.copernicus.eu/v1/collections/sentinel-2-l2a/queryables 
- https://geojson.org/schema/Feature.json

## Note: Since the Copernicus STAC API returns raw JP2000 data, the following API is used instead, as it provides the data directly in TIFF format.

API Name: Microsoft Planetary Computer

Base URL: https://planetarycomputer.microsoft.com/api/stac/v1

Protocol: POST

Endpoints: /search

Ref: https://planetarycomputer.microsoft.com/api/stac/v1/queryables

```js
https://planetarycomputer.microsoft.com/api/stac/v1/search

{
    "collections": [
        "sentinel-2-l2a"
    ],
    "limit": 20,
    "filter": {
        "op": "and",
        "args": [
            {
                "op": "<=",
                "args": [
                    {
                        "property": "eo:cloud_cover"
                    },
                    10
                ]
            },
            {
                "op": ">=",
                "args": [
                    {
                        "property": "datetime"
                    },
                    {
                        "timestamp": "2025-08-19T00:00:00Z"
                    }
                ]
            },
            {
                "op": "s_contains",
                "args": [
                    {
                        "property": "geometry"
                    },
                    {
                        "type": "Polygon",
                        "coordinates": [
                            [
                                [
                                    6.980803263345194,
                                    51.10990285774977
                                ],
                                [
                                    7.683914901863773,
                                    51.10389656882401
                                ],
                                [
                                    7.675943114578587,
                                    50.8760849480924
                                ],
                                [
                                    6.9728314760600085,
                                    50.88815585282626
                                ],
                                [
                                    6.980803263345194,
                                    51.10990285774977
                                ]
                            ]
                        ]
                    }
                ]
            }
        ]
    }
}
```

## Projection and tiling
| Feature    | Web Mercator            | UTM                          |
| ---------- | ----------------------- | ---------------------------- |
| Unit       | Degrees (lat/lon)       | Meters                       |
| Accuracy   | Low for area & distance | High                         |
| Use        | Web map visualization   | Data analysis & calculations |
| Distortion | High near poles         | Low within a zone            |

