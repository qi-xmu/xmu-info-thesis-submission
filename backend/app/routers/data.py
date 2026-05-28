from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Phase, Task, TimeNode
from ..schemas import FullDataResponse, PhaseOut, SiteInfo, RoleOption
from datetime import datetime
import json
import os

router = APIRouter(prefix="/api", tags=["data"])

SEED_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "seed_data.py")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
TRACKER_JSON = os.path.join(DATA_DIR, "tracker.json")

DEFAULT_SITE = {
    "title": "厦门大学信息学院 研究生毕业论文流程跟踪",
    "description": "来源：信息学院（国家示范性软件学院）",
    "roles": [
        {"value": "doctor", "label": "博士", "desc": "学术型博士研究生", "color": "purple"},
        {"value": "master", "label": "学术硕士", "desc": "学术型硕士研究生", "color": "blue"},
        {"value": "professional", "label": "专业硕士", "desc": "专业学位硕士研究生", "color": "green"},
    ],
}


def load_site_info() -> SiteInfo:
    # Try loading from tracker.json first
    if os.path.exists(TRACKER_JSON):
        try:
            with open(TRACKER_JSON, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "site" in data:
                return SiteInfo(**data["site"])
        except Exception:
            pass

    # Fallback: load from seed_data.py
    try:
        from ..seed_data import SEED_DATA
        if "site" in SEED_DATA:
            return SiteInfo(**SEED_DATA["site"])
    except Exception:
        pass

    return SiteInfo(**DEFAULT_SITE)


@router.get("/data", response_model=FullDataResponse)
def get_all_data(db: Session = Depends(get_db)):
    phases = (
        db.query(Phase)
        .options(
            joinedload(Phase.tasks)
            .joinedload(Task.sub_tasks),
            joinedload(Phase.tasks)
            .joinedload(Task.sub_files),
            joinedload(Phase.tasks)
            .joinedload(Task.time_nodes),
        )
        .order_by(Phase.sort_order)
        .all()
    )

    site = load_site_info()
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return FullDataResponse(site=site, phases=phases, updated_at=now)


@router.get("/data/updated_at")
def get_updated_at():
    return {"updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
