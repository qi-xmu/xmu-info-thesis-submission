from fastapi import APIRouter
from ..schemas import FullDataResponse
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api", tags=["data"])

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
TRACKER_JSON = os.path.join(DATA_DIR, "tracker.json")


def load_json_data() -> dict:
    if not os.path.exists(TRACKER_JSON):
        return {"site": {}, "phases": []}
    with open(TRACKER_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def get_file_mtime() -> str:
    if not os.path.exists(TRACKER_JSON):
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    mtime = os.path.getmtime(TRACKER_JSON)
    return datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")


@router.get("/data", response_model=FullDataResponse)
def get_all_data():
    data = load_json_data()
    site = data.get("site", {})
    phases = data.get("phases", [])
    updated_at = get_file_mtime()
    return FullDataResponse(site=site, phases=phases, updated_at=updated_at)


@router.get("/data/updated_at")
def get_updated_at():
    return {"updated_at": get_file_mtime()}
