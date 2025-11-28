import { IGeometry } from "./geoJSON";

export enum ESTACURLS {
  baseURL = "https://catalogue.dataspace.copernicus.eu/stac",
  //searchURL = "https://stac.dataspace.copernicus.eu/v1/search",
  searchURL = "https://planetarycomputer.microsoft.com/api/stac/v1/search",
  signURL = "https://planetarycomputer.microsoft.com/api/sas/v1/sign?href=",
  collectionTokenURL = "https://planetarycomputer.microsoft.com/api/sas/v1/token/",
  collectionsURL = "https://stac.dataspace.copernicus.eu/v1/collections",
  queryablesURL = "https://stac.dataspace.copernicus.eu/v1/queryables",
  featureJSONURL = "https://geojson.org/schema/Feature.json",
}

export enum EStacBands {
  nir = "B08",
  red = "B04",
}

export enum ESTACCollections {
  Sentinel2l2a = "sentinel-2-l2a",
}

export type TComparisonOperators = "=" | "<>" | "<" | "<=" | ">" | ">=";

export type TLogicalOperators = "and" | "or" | "not" | "between" | "in";

export type TSpatialComparison =
  | "s_intersects"
  | "s_within"
  | "s_contains"
  | "s_crosses"
  | "s_disjoint"
  | "s_equals"
  | "s_overlaps"
  | "s_touches";

export interface ISpatialItem { 
  title: string; 
  value: TSpatialComparison 
}
export const spatialItems: ISpatialItem[] = [
  { title: "Contains", value: "s_contains" },
  { title: "Intersects", value: "s_intersects" },
  { title: "Within", value: "s_within" },
  { title: "Crosses", value: "s_crosses" },
  { title: "Disjoint", value: "s_disjoint" },
  { title: "Equals", value: "s_equals" },
  { title: "Overlaps", value: "s_overlaps" },
  { title: "Touches", value: "s_touches" },
];



export type TTemporalComparison =
  | "t_starts"
  | "t_startedby"
  | "t_overlaps"
  | "t_overlappedby"
  | "t_metby"
  | "t_meets"
  | "t_intersects"
  | "t_finishes"
  | "t_finishedby"
  | "t_equals"
  | "t_during"
  | "t_disjoint"
  | "t_before"
  | "t_contains"
  | "t_after";


export interface ITemporalItem {
  title: string,
  value: TTemporalComparison
}
export const temporalItems: ITemporalItem[] = [
  { title: "During", value: "t_during" },
  { title: "After Start", value: "t_after" },
  { title: "Before End", value: "t_before" },
];

// CloudCover
export type TCloudCoverArgs = [
  {
    property: "eo:cloud_cover";
  },
  number,
  number?,
];
export type TCloudCoverFilter = {
  op: TComparisonOperators;
  args: TCloudCoverArgs;
};

// Snowcover
export type TSnowCoverArgs = [
  {
    //property: "eo:snow_cover";
    property: "s2:snow_ice_percentage";
  },
  number,
  number?,
];
export type TSnowCoverFilter = {
  op: TComparisonOperators;
  args: TSnowCoverArgs;
};

// DateTime
export type TDateTimeArgs = [
  {
    property: "datetime";
  },
  {
    timestamp?: string;
    interval?: string[];
  },
];
export type TDateTimeFilter = {
  op: TComparisonOperators | TTemporalComparison;
  args: TDateTimeArgs;
};

// Id
export type TIdArgs = [
  {
    property: "id";
  },
  string,
];
export type TIdFilter = {
  op: TComparisonOperators;
  args: TIdArgs;
};

// Spatial
export type TSpatialArgs = [
  {
    property: "geometry";
  },
  IGeometry,
];
export type TSpatialFilter = {
  op: TSpatialComparison;
  args: TSpatialArgs;
};

export interface ISTACFilterOP {
  op:
    | TComparisonOperators
    | TLogicalOperators
    | TTemporalComparison
    | TSpatialComparison;
  args: TCloudCoverArgs | TDateTimeArgs | TIdArgs;
}

export interface ISTACFilter {
  op: TLogicalOperators;
  args: (TCloudCoverFilter | TSnowCoverFilter | TDateTimeFilter | TIdFilter | TSpatialFilter)[];
}

export interface ISTACFilterRequest {
  collections: [ESTACCollections];
  filter?: ISTACFilter;
  datetime?: string;
  limit?: number
}

export interface ISTACResponseLink {
  rel: string; // "root" "self"
  type: string; // "application/json"
  href: string; // https link
}

export enum ESTACResponseType {
  FeatureCollection = "FeatureCollection",
}

export interface ISTACResponseFeature {
  type: "Feature";
  stac_version: string;
  stac_extensions: string[];
  id: string;
  collection: string;
  bbox: number[];
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
  properties: IStacProperties;
  assets: Record<string, IStacAsset>;
  links: IStacLink[];
}

export interface IStacProperties {
  gsd: number;
  created: string;
  expires: string;
  updated: string;
  datetime: string;
  "eopf:processing_level"?: string;
  "sat:orbit_state"?: string;
  "sat:relative_orbit"?: number;
  [key: string]: any;
}

export interface IStacAsset {
  href: string;
  title?: string;
  type: string;
  roles?: string[];
  data_type?: string;
  gsd?: number;
  nodata?: number;

  // Raster properties
  "raster:offset"?: number;
  "raster:scale"?: number;

  // File metadata
  "file:checksum"?: string;
  "file:size"?: number;
  "file:local_path"?: string;

  // Projection metadata
  "proj:code"?: string;
  "proj:bbox"?: number[];
  "proj:shape"?: number[];
  "proj:transform"?: number[];

  // Alternate access
  alternate?: Record<"https", IStacAlternate>;
  "alternate:name"?: string;

  // Storage references
  "storage:refs"?: string[];
  "auth:refs"?: string[];

  [key: string]: any;
}

export interface IStacAlternate {
  href: string;
  "alternate:name": string;
  "storage:refs": any[];
  "auth:refs": string[];
}

export interface IStacLink {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

export interface ISTACFilterResponse {
  features: ISTACResponseFeature[];
  links: ISTACResponseLink[];
  numberReturned: number;
  type: ESTACResponseType;
}

export interface ISTACTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  "not-before-policy": number;
  scope: string;
}

// Microsoft Planetary Computer

export interface IStacSearchResponse {
  type: "FeatureCollection";
  features: IStacItem[];
  links?: StacLink[];
  context?: {
    returned: number;
    limit: number;
    matched: number;
  };
}

// STAC Item (one Sentinel-2 scene)
export interface IStacItem {
  type: "Feature";
  id: string;
  collection: string;
  geometry: GeoJSON.Polygon;
  bbox: number[];
  properties: {
    datetime: string; // e.g., "2025-11-22T10:42:49Z"
    "eo:cloud_cover"?: number;
    [key: string]: any; // any other properties
  };
  assets: {
    [key: string]: StacAsset;
  };
  links?: StacLink[];
}

// STAC asset (one band)
export interface StacAsset {
  href: string; // URL to the GeoTIFF / COG
  type?: string; // MIME type, e.g., "image/tiff; application=geotiff"
  roles?: string[]; // e.g., ["data", "analytic"]
  title?: string;
  [key: string]: any;
}

// STAC link
export interface StacLink {
  href: string;
  rel: string;
  type?: string;
  title?: string;
}

export interface ITokenCollection {
  "msft:expiry": string;
  token: string;
}
