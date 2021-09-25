import numpy as np
import geopandas as gpd
import rasterio as rio
import rasterio.features
from matplotlib import pyplot as plt
from pyproj import CRS, Transformer
import osmnx as ox
from shapely import affinity
from shapely.geometry import Point
from shapely.ops import transform as shp_transform
from skimage.segmentation import watershed
from skimage.io import imsave

def flood_fill_rivers_height_map(height_map, flood_height):
    hm = height_map.read(1)
    osm_crs = CRS.from_epsg(4326)
    bounds = height_map.bounds
    hm_osm_trans = Transformer.from_crs(height_map.crs, osm_crs, always_xy=True)
    osm_hm_trans = Transformer.from_crs(osm_crs, height_map.crs, always_xy=True)
    bl = hm_osm_trans.transform(bounds[0], bounds[1])
    tr = hm_osm_trans.transform(bounds[2], bounds[3])
    bbox = (bl[1], tr[1], bl[0], tr[0])
    tags = {"waterway": True}
    geom = ox.geometries.geometries_from_bbox(*bbox, tags)
    rivers = geom[geom['waterway']=='river']
    rivers_geom = rivers.geometry
    mat = np.array(hm_ds.transform).reshape((3,3))
    mat = np.linalg.inv(mat)
    mat = mat.flatten()[:6]
    mat = [*mat[:2], *mat[3:5], mat[2], mat[5]]
    river_mask = np.zeros(hm.shape, dtype=bool)
    for r in rivers_geom:
        r = shp_transform(osm_hm_trans.transform, r)
        r = affinity.affine_transform(r, mat)
        river_mask |= rio.features.rasterize((r, 1), out_shape=hm.shape).astype(bool)
    max_river_bed = hm[river_mask].max()
    height_mask = hm <= max_river_bed + flood_height
    res = watershed(hm, river_mask, mask=height_mask)
    return res