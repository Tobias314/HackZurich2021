from typing import List

from shapely.geometry import Polygon


def polygons_to_json(polygons: List[Polygon]):
    polys_json = []
    for poly in polygons:
        poly_json = {}
        shell = poly.exterior
        xy = shell.xy
        if shell.is_ccw:
            print("Inverting shell")
            xy = (xy[0][::-1], xy[1][::-1])
        xy_json = list(zip(xy[0].tolist(), xy[1].tolist()))
        poly_json['shell'] = xy_json
        holes = []
        for hole in poly.interiors:
            xy = hole.xy
            if not hole.is_ccw:
                print("Inverting hole")
                xy = (xy[0][::-1], xy[1][::-1])
            xy_json = list(zip(xy[0].tolist(), xy[1].tolist()))
            holes.append(xy_json)
        poly_json['holes']=holes
        polys_json.append(poly_json)
    poly_json = {"polygons": polys_json}
    return poly_json