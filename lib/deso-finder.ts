import {
  BoundingBox,
  FeatureIndexManager,
  GeoPackage,
  GeoPackageManager,
} from '@ngageoint/geopackage';
import { ProjectionTransform, Projections } from '@ngageoint/projections-js';
import { GeometryUtils, Point, Polygon } from '@ngageoint/simple-features-js';

const WGS84 = Projections.getWGS84Projection();

/**
 * An object describing a DeSO look-up result
 */
export interface DeSOResult {
  /** Code for this DeSO (e.g. `1257C1010`) */
  deso: string;

  /** Code for municipality containing this DeSO (e.g. `1257`) */
  municipality: string;

  /** Code for county containing this DeSO (e.g. `12`) */
  county: string;
}

/**
 * Class used to manage a DeSO GeoPackage file for looking up Demographic Statistical Areas
 *
 * This class requires async initialization because it manages a SQLite connection. Use the static method `DeSOFinder.open` to create a new finder that can be re-used.
 */
export class DeSOFinder {
  /**
   * Open a new DeSO finder against a GeoPackage file
   */
  public static async open() {
    // TODO: We probably shouldn't hard-code the path to the DeSO package, as a relative path and we probably should fail gracefully if we cannot open it
    const geoPackage = await GeoPackageManager.open('DeSO_2018_v2.gpkg');
    const features = new FeatureIndexManager(geoPackage, 'DeSO_2018_v2');
    const transform = WGS84.getTransformation(
      features.getFeatureDao().getProjection(),
    );

    return new DeSOFinder(geoPackage, features, transform);
  }

  /**
   * Close the DeSO finder to clean up resources
   */
  public close() {
    this.features.close();
    this.geoPackage.close();
  }

  /**
   * Find the Demographic Statistical Area that surrounds a latitude and longitude
   *
   * @param lat Latitude
   * @param lng Longitude
   * @returns An object describing the DeSO at `[lat, lng]`. If the coordinate is outside Sweden, returns `undefined`.
   */
  public find(lat: number, lng: number): DeSOResult | undefined {
    const point = new Point(
      ...(this.transform.transform(lng, lat) as [number, number]),
    );

    const results = this.features.queryWithBoundingBox(new BoundingBox(point));
    for (const row of results) {
      const polygon = row.getGeometryValue() as Polygon;

      if (GeometryUtils.pointInPolygon(point, polygon)) {
        results.close();

        return {
          deso: row.getValue('deso'),
          municipality: row.getValue('kommun'),
          county: row.getValue('lan'),
        };
      }
    }

    results.close();
  }

  private constructor(
    private geoPackage: GeoPackage,
    private features: FeatureIndexManager,
    private transform: ProjectionTransform,
  ) {}
}
