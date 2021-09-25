import numpy as np
import geopandas as gpd
import rasterio as rio
import rasterio.features
from matplotlib import pyplot as plt
from pyproj import CRS, Transformer
import osmnx as ox
from shapely import affinity
from shapely.geometry import Polygon
from shapely.ops import transform as shp_transform
from skimage.segmentation import watershed
from skimage.io import imsave
import cv2 as cv

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
    mat = np.array(height_map.transform).reshape((3,3))
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

def bool_raster_to_polygon(raster):
    res = (raster > 0).astype(np.uint8)
    cnts, hier = cv.findContours(res, mode=cv.RETR_CCOMP, method=cv.CHAIN_APPROX_TC89_KCOS)
    holes = [[] for t in hier[0]]
    for i,h in enumerate(hier[0]):
        if h[3] >= 0 and cnts[i].shape[0] >= 3:
            holes[h[3]].append(np.squeeze(cnts[i]))
    polys = []
    for i, cnt in enumerate(cnts):
        if hier[0,i,3]==-1:
            shell = np.squeeze(cnt)
            shell_holes = holes[i]
            if shell.shape[0] >= 3:
                polys.append(Polygon(shell, shell_holes))
    return polys