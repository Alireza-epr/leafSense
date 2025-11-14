// Geometry Interfaces
export type TGeoJSONGeometryType = 
  | "Point"
  | "LineString"
  | "Polygon"
  | "MultiPoint"
  | "MultiLineString"
  | "MultiPolygon";

export interface IGeometry {
  type: TGeoJSONGeometryType;
  coordinates: any; // depends on type, we refine below
}

// Specific geometries
export interface IPointGeometry extends IGeometry {
  type: "Point";
  coordinates: [number, number]; // [lng, lat]
}

export interface ILineStringGeometry extends IGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface IPolygonGeometry extends IGeometry {
  type: "Polygon";
  coordinates: [ [number, number][] ]; // array of rings
}

// Feature Interface
export interface IFeature<G extends IGeometry = IGeometry, P = any> {
  type: "Feature";
  geometry: G;
  properties?: P; // optional metadata
}


// FeatureCollection Interface
export interface FeatureCollection<G extends IGeometry = IGeometry, P = any> {
  type: "FeatureCollection";
  features: IFeature<G, P>[];
}