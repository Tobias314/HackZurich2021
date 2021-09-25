from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from numpy import flexible
import rasterio as rio

from watersimulation.floodfill import flood_fill_rivers_height_map, bool_raster_to_polygon
from formatting import polygons_to_json

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


height_map_path = "../../data/DTM_Ahrweiler.tif"
FLOOD_HEIGHT = 20

height_map_data_set = rio.open(height_map_path)


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/floodarea")
def flood_polygon():
    flooded_map = flood_fill_rivers_height_map(height_map_data_set, FLOOD_HEIGHT)
    polygons = bool_raster_to_polygon(flooded_map)
    polygons = polygons_to_json(polygons=polygons)
    return polygons