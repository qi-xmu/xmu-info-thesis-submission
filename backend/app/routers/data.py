from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from ..database import get_db
from ..models import Phase, Task, TimeNode
from ..schemas import FullDataResponse, PhaseOut
from datetime import datetime

router = APIRouter(prefix="/api", tags=["data"])


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

    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return FullDataResponse(phases=phases, updated_at=now)


@router.get("/data/updated_at")
def get_updated_at():
    return {"updated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
