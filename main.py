from fastapi import FastAPI, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from numpy import flexible
import rasterio as rio
from pyproj import CRS, Transformer

from sse_starlette.sse import EventSourceResponse

MESSAGE_STREAM_DELAY = 1  # second
MESSAGE_STREAM_RETRY_TIMEOUT = 15000  # milisecond

from backend.watersimulation.floodfill import flood_fill_rivers_height_map, bool_raster_to_polygon
from backend.formatting import polygons_to_json

from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.staticfiles import StaticFiles


routes = [
    Mount('/frontend', app=StaticFiles(directory='frontend'), name="frontend"),
]

app = FastAPI(routes=routes)

origins = [
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:8000/*",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


height_map_path = "../data/DTM_Ahrweiler.tif"
FLOOD_HEIGHT = 5

height_map_data_set = rio.open(height_map_path)
webmap_crs =  CRS.from_epsg(4326)
hm_webmap_crs_transformer = Transformer.from_crs(height_map_data_set.crs, webmap_crs, always_xy=True)


@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/floodarea")
def flood_polygon():
    flooded_map = flood_fill_rivers_height_map(height_map_data_set, FLOOD_HEIGHT)
    polygons = bool_raster_to_polygon(flooded_map, affine=height_map_data_set.transform, transformer=hm_webmap_crs_transformer)
    polygons = polygons_to_json(polygons=polygons)
    return polygons
    
    
@app.post("/locationentry")
async def locationentry(FullName: str = Form(...), emailID: str = Form(...), TypeOfRisk: str = Form(...)):
    print(FullName)
    return None


@app.get('/stream')
async def message_stream(request: Request):
    def new_messages(): ...
    async def event_generator():
        while True:
            # If client was closed the connection
            if await request.is_disconnected():
                break

            # Checks for new messages and return them to client if any
            if new_messages():
                yield {
                        "event": "new_message",
                        "id": "message_id",
                        "retry": MESSAGE_STREAM_RETRY_TIMEOUT,
                        "data": "message_content"
                }

            await asyncio.sleep(MESSAGE_STREAM_DELAY)

    return EventSourceResponse(event_generator())