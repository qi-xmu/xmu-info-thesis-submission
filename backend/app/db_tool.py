"""数据库与 JSON 互转工具

用法：
    python -m app.db_tool export              # 导出 DB → data/tracker.json
    python -m app.db_tool import              # 导入 data/tracker.json → DB
    python -m app.db_tool export -o out.json  # 指定输出路径
    python -m app.db_tool import -i in.json   # 指定输入路径
"""

import sys
import os
import json
import argparse
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import engine, SessionLocal, Base
from app.models import Phase, Task, TimeNode, SubTask, SubFile


def export_db(output_path: str):
    db = SessionLocal()
    try:
        phases = db.query(Phase).order_by(Phase.sort_order).all()

        # Load site info from seed_data or existing JSON
        site = None
        if os.path.exists(output_path):
            try:
                with open(output_path, "r", encoding="utf-8") as f:
                    existing = json.load(f)
                site = existing.get("site")
            except Exception:
                pass
        if site is None:
            try:
                from app.seed_data import SEED_DATA
                site = SEED_DATA.get("site")
            except Exception:
                pass

        data = {
            "exported_at": datetime.now().isoformat(),
            "phases": [],
        }
        if site:
            data["site"] = site

        for phase in phases:
            tasks = db.query(Task).filter(Task.phase_id == phase.id).order_by(Task.sort_order).all()
            phase_data = {
                "id": phase.id,
                "title": phase.title,
                "description": phase.description,
                "sort_order": phase.sort_order,
                "tasks": [],
            }

            for task in tasks:
                sub_tasks = db.query(SubTask).filter(SubTask.task_id == task.id).order_by(SubTask.sort_order).all()
                sub_files = db.query(SubFile).filter(SubFile.task_id == task.id).order_by(SubFile.sort_order).all()
                time_nodes = db.query(TimeNode).filter(TimeNode.task_id == task.id).all()

                task_data = {
                    "id": task.id,
                    "title": task.title,
                    "applies_to": task.applies_to,
                    "notes": task.notes or [],
                    "sort_order": task.sort_order,
                    "sub_tasks": [
                        {"id": st.id, "title": st.title, "applies_to": st.applies_to, "sort_order": st.sort_order}
                        for st in sub_tasks
                    ],
                    "sub_files": [
                        {
                            "id": sf.id, "name": sf.name, "format": sf.format,
                            "naming_rule": sf.naming_rule, "description": sf.description,
                            "applies_to": sf.applies_to, "sort_order": sf.sort_order,
                        }
                        for sf in sub_files
                    ],
                    "time_nodes": [
                        {"id": tn.id, "name": tn.name, "deadline": tn.deadline, "remark": tn.remark, "applies_to": tn.applies_to}
                        for tn in time_nodes
                    ],
                }
                phase_data["tasks"].append(task_data)

            data["phases"].append(phase_data)

        os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        stats = {
            "phases": len(data["phases"]),
            "tasks": sum(len(p["tasks"]) for p in data["phases"]),
            "sub_tasks": sum(len(t["sub_tasks"]) for p in data["phases"] for t in p["tasks"]),
            "sub_files": sum(len(t["sub_files"]) for p in data["phases"] for t in p["tasks"]),
        }
        print(f"Exported to {output_path}: {stats}")
    finally:
        db.close()


def import_json(input_path: str):
    with open(input_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        for phase_data in data.get("phases", []):
            phase = Phase(
                id=phase_data.get("id"),
                title=phase_data["title"],
                description=phase_data.get("description"),
                sort_order=phase_data.get("sort_order", 0),
            )
            db.add(phase)
            db.flush()

            for task_data in phase_data.get("tasks", []):
                task = Task(
                    id=task_data.get("id"),
                    phase_id=phase.id,
                    title=task_data["title"],
                    applies_to=task_data.get("applies_to", "all"),
                    notes=task_data.get("notes", []),
                    sort_order=task_data.get("sort_order", 0),
                )
                db.add(task)
                db.flush()

                for st_data in task_data.get("sub_tasks", []):
                    st = SubTask(
                        id=st_data.get("id"),
                        task_id=task.id,
                        title=st_data["title"],
                        applies_to=st_data.get("applies_to", "all"),
                        sort_order=st_data.get("sort_order", 0),
                    )
                    db.add(st)

                for sf_data in task_data.get("sub_files", []):
                    sf = SubFile(
                        id=sf_data.get("id"),
                        task_id=task.id,
                        name=sf_data["name"],
                        format=sf_data.get("format"),
                        naming_rule=sf_data.get("naming_rule"),
                        description=sf_data.get("description"),
                        applies_to=sf_data.get("applies_to", "all"),
                        sort_order=sf_data.get("sort_order", 0),
                    )
                    db.add(sf)

                for tn_data in task_data.get("time_nodes", []):
                    tn = TimeNode(
                        id=tn_data.get("id"),
                        task_id=task.id,
                        name=tn_data.get("name"),
                        deadline=tn_data.get("deadline"),
                        remark=tn_data.get("remark"),
                        applies_to=tn_data.get("applies_to", "all"),
                    )
                    db.add(tn)

        db.commit()
        stats = {
            "phases": db.query(Phase).count(),
            "tasks": db.query(Task).count(),
            "sub_tasks": db.query(SubTask).count(),
            "sub_files": db.query(SubFile).count(),
        }
        print(f"Imported from {input_path}: {stats}")
    finally:
        db.close()


def main():
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
    default_json = os.path.join(data_dir, "tracker.json")

    parser = argparse.ArgumentParser(description="数据库与 JSON 互转工具")
    sub = parser.add_subparsers(dest="command", required=True)

    p_export = sub.add_parser("export", help="导出 DB → JSON")
    p_export.add_argument("-o", "--output", default=default_json, help="输出 JSON 路径")

    p_import = sub.add_parser("import", help="导入 JSON → DB")
    p_import.add_argument("-i", "--input", default=default_json, help="输入 JSON 路径")

    args = parser.parse_args()

    if args.command == "export":
        export_db(args.output)
    elif args.command == "import":
        import_json(args.input)


if __name__ == "__main__":
    main()
