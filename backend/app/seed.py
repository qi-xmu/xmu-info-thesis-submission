"""种子脚本：建表 + 填充初始流程数据"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import Phase, Task, TimeNode, SubTask, SubFile
from app.seed_data import SEED_DATA


def run_seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for phase_data in SEED_DATA["phases"]:
            phase = Phase(
                title=phase_data["title"],
                description=phase_data.get("description"),
                sort_order=phase_data.get("sort_order", 0),
            )
            db.add(phase)
            db.flush()

            for idx, task_data in enumerate(phase_data.get("tasks", [])):
                task = Task(
                    phase_id=phase.id,
                    title=task_data["title"],
                    applies_to=task_data.get("applies_to", "all"),
                    notes=task_data.get("notes", []),
                    sort_order=task_data.get("sort_order", idx),
                )
                db.add(task)
                db.flush()

                for tn_data in task_data.get("time_nodes", []):
                    tn = TimeNode(
                        task_id=task.id,
                        name=tn_data.get("name"),
                        deadline=tn_data.get("deadline"),
                        remark=tn_data.get("remark"),
                    )
                    db.add(tn)

                for st_idx, st_data in enumerate(task_data.get("sub_tasks", [])):
                    if isinstance(st_data, dict):
                        st = SubTask(
                            task_id=task.id,
                            title=st_data["title"],
                            applies_to=st_data.get("applies_to", "all"),
                            sort_order=st_idx,
                        )
                    else:
                        st = SubTask(
                            task_id=task.id,
                            title=st_data,
                            applies_to="all",
                            sort_order=st_idx,
                        )
                    db.add(st)

                for sf_idx, sf_data in enumerate(task_data.get("sub_files", [])):
                    sf = SubFile(
                        task_id=task.id,
                        name=sf_data["name"],
                        format=sf_data.get("format"),
                        naming_rule=sf_data.get("naming_rule"),
                        description=sf_data.get("description"),
                        applies_to=sf_data.get("applies_to", "all"),
                        sort_order=sf_idx,
                    )
                    db.add(sf)

        db.commit()
        counts = {
            "phases": db.query(Phase).count(),
            "tasks": db.query(Task).count(),
            "sub_tasks": db.query(SubTask).count(),
            "sub_files": db.query(SubFile).count(),
        }
        print(f"Seed completed: {counts}")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()
