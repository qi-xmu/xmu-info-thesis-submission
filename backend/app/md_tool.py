"""自定义 Markdown 语言与 tracker.json 双向转换工具

用法：
    python -m app.md_tool to-json tracker.md -o tracker.json
    python -m app.md_tool to-md tracker.json -o tracker.md
"""

import sys
import os
import re
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ──────────────────────────── 行类型判断 ────────────────────────────

def line_type(line: str) -> str:
    s = line.strip()
    if not s:
        return "empty"
    if s.startswith("# ") and not s.startswith("## "):
        return "h1"
    if s.startswith("> ROLE"):
        return "role"
    if s.startswith("### "):
        return "task_header"
    if s.startswith("## "):
        return "phase"
    return "content"


# ──────────────────────────── md → json ────────────────────────────

def parse_md(text: str) -> dict:
    lines = text.split("\n")
    result = {"site": {"title": "", "description": "", "roles": []}, "phases": []}
    i = 0

    def read_paragraph(start: int, stop_types: set[str]) -> tuple[list[str], int]:
        """读取连续的非空内容行，保留空行作为段落分隔，直到遇到 stop_types 类型的行或文件末尾"""
        parts = []
        j = start
        prev_empty = False
        while j < len(lines):
            lt = line_type(lines[j])
            if lt in stop_types:
                break
            if lt == "empty":
                prev_empty = True
                j += 1
                continue
            if prev_empty and parts:
                parts.append("")  # 空行 = 段落分隔
            parts.append(lines[j].strip())
            prev_empty = False
            j += 1
        return parts, j

    # ── 解析 site.title ──
    while i < len(lines) and line_type(lines[i]) != "h1":
        i += 1
    if i < len(lines):
        result["site"]["title"] = lines[i].strip()[2:].strip()
        i += 1

    # ── 解析 site.description ──
    desc_parts, i = read_paragraph(i, {"role", "phase"})
    result["site"]["description"] = "\n".join(desc_parts)

    # ── 解析 roles ──
    while i < len(lines) and line_type(lines[i]) == "role":
        parts = lines[i].strip()[len("> ROLE"):].strip().split(None, 3)
        role = {"value": parts[0], "label": parts[1] if len(parts) > 1 else parts[0]}
        if len(parts) > 2:
            role["desc"] = parts[2]
        if len(parts) > 3:
            role["color"] = parts[3]
        result["site"]["roles"].append(role)
        i += 1

    # ── 解析 phases ──
    while i < len(lines):
        # 跳过空行
        while i < len(lines) and line_type(lines[i]) == "empty":
            i += 1
        if i >= len(lines):
            break

        # 阶段
        if line_type(lines[i]) != "phase":
            i += 1
            continue

        phase = {"title": lines[i].strip()[3:].strip(), "sort_order": len(result["phases"]) + 1, "tasks": []}
        i += 1

        # 阶段描述
        desc_parts, i = read_paragraph(i, {"task_header", "phase"})
        phase["description"] = "\n".join(desc_parts)
        result["phases"].append(phase)

        # 解析该阶段下的任务
        while i < len(lines):
            while i < len(lines) and line_type(lines[i]) == "empty":
                i += 1
            if i >= len(lines) or line_type(lines[i]) in ("phase", "h1", "role"):
                break

            if line_type(lines[i]) != "task_header":
                i += 1
                continue

            m = re.match(r"^###\s+(.+?)\s+\[(\w+)\]\s*$", lines[i].strip())
            if not m:
                i += 1
                continue

            task = {
                "title": m.group(1).strip(),
                "applies_to": m.group(2),
                "notes": [],
                "sub_tasks": [],
                "sub_files": [],
                "time_nodes": [],
                "sort_order": len(phase["tasks"]) + 1,
            }
            phase["tasks"].append(task)
            i += 1

            # 解析任务内部
            while i < len(lines):
                lt = line_type(lines[i])
                s = lines[i].strip()

                # 遇到新任务/新阶段/新角色 → 结束当前任务
                if lt in ("task_header", "phase", "h1", "role"):
                    break

                # 空行 → 段落结束
                if lt == "empty":
                    i += 1
                    continue

                # ── 时间节点: - @name deadline [applies_to] remark ──
                tm = re.match(r"^-\s+@(.+?)\s+(\S+)\s+\[(\w+)\]\s*(.*)$", s)
                if tm:
                    task["time_nodes"].append({
                        "name": tm.group(1).strip(),
                        "deadline": tm.group(2).strip(),
                        "applies_to": tm.group(3),
                        "remark": tm.group(4).strip(),
                    })
                    i += 1
                    continue

                # ── 子文件: - 文件名 [applies_to] + 缩进块 ──
                sfm = re.match(r"^-\s+(.+?)\s+\[(\w+)\]\s*$", s)
                if sfm and not s.startswith("- 格式:") and not s.startswith("- 命名:"):
                    sf = {
                        "name": sfm.group(1).strip(),
                        "applies_to": sfm.group(2),
                        "format": "",
                        "naming_rule": "",
                        "description": "",
                        "sort_order": len(task["sub_files"]),
                    }
                    i += 1
                    desc_parts = []
                    while i < len(lines):
                        sl = lines[i]
                        ss = sl.strip()
                        # 非缩进或空行 → 退出子文件块
                        if not sl.startswith("  ") and not sl.startswith("\t"):
                            break
                        field = ss.lstrip("- ").strip()
                        if field.startswith("格式:"):
                            sf["format"] = field[3:].strip()
                        elif field.startswith("命名:"):
                            sf["naming_rule"] = field[3:].strip()
                        elif field:
                            desc_parts.append(field)
                        i += 1
                    if desc_parts:
                        sf["description"] = "\n".join(desc_parts)
                    task["sub_files"].append(sf)
                    continue

                # ── 子任务: - [applies_to] 内容 ──
                stm = re.match(r"^-\s+\[(\w+)\]\s+(.+)$", s)
                if stm:
                    task["sub_tasks"].append({
                        "title": stm.group(2).strip(),
                        "applies_to": stm.group(1),
                        "sort_order": len(task["sub_tasks"]),
                    })
                    i += 1
                    continue

                # ── 普通段落行 → notes ──
                para_parts = []
                while i < len(lines):
                    lt2 = line_type(lines[i])
                    s2 = lines[i].strip()
                    if lt2 in ("task_header", "phase", "h1", "role", "empty"):
                        break
                    # 如果匹配子任务/子文件/时间节点模式，也停止
                    if re.match(r"^-\s+@", s2) or re.match(r"^-\s+\[\w+\]", s2) or re.match(r"^-\s+.+\[\w+\]\s*$", s2):
                        break
                    para_parts.append(s2)
                    i += 1
                if para_parts:
                    task["notes"].append("\n".join(para_parts))

    return result


# ──────────────────────────── json → md ────────────────────────────

def to_md(data: dict) -> str:
    lines = []
    site = data.get("site", {})

    lines.append(f"# {site.get('title', '')}")
    lines.append("")
    lines.append(site.get("description", ""))
    lines.append("")

    for role in site.get("roles", []):
        parts = [role["value"], role.get("label", role["value"])]
        if "desc" in role:
            parts.append(role["desc"])
        if "color" in role:
            parts.append(role["color"])
        lines.append(f"> ROLE {' '.join(parts)}")
    lines.append("")

    for phase in data.get("phases", []):
        lines.append(f"## {phase['title']}")
        if phase.get("description"):
            lines.append(phase["description"])
        lines.append("")

        for task in phase.get("tasks", []):
            lines.append(f"### {task['title']} [{task.get('applies_to', 'all')}]")
            lines.append("")

            for note in task.get("notes", []):
                lines.append(note)
                lines.append("")

            for st in task.get("sub_tasks", []):
                lines.append(f"- [{st.get('applies_to', 'all')}] {st['title']}")
            if task.get("sub_tasks"):
                lines.append("")

            for sf in task.get("sub_files", []):
                lines.append(f"- {sf['name']} [{sf.get('applies_to', 'all')}]")
                if sf.get("format"):
                    lines.append(f"  - 格式: {sf['format']}")
                if sf.get("naming_rule"):
                    lines.append(f"  - 命名: {sf['naming_rule']}")
                if sf.get("description"):
                    lines.append(f"  - {sf['description']}")
            if task.get("sub_files"):
                lines.append("")

            for tn in task.get("time_nodes", []):
                remark = f" {tn['remark']}" if tn.get("remark") else ""
                lines.append(f"- @{tn['name']} {tn['deadline']} [{tn.get('applies_to', 'all')}]{remark}")
            if task.get("time_nodes"):
                lines.append("")

    return "\n".join(lines)


# ──────────────────────────── CLI ────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="自定义 Markdown 与 tracker.json 双向转换")
    sub = parser.add_subparsers(dest="command", required=True)

    p_tojson = sub.add_parser("to-json", help="Markdown → JSON")
    p_tojson.add_argument("input", help="输入 .md 文件路径")
    p_tojson.add_argument("-o", "--output", default=None, help="输出 .json 路径")

    p_tomd = sub.add_parser("to-md", help="JSON → Markdown")
    p_tomd.add_argument("input", help="输入 .json 文件路径")
    p_tomd.add_argument("-o", "--output", default=None, help="输出 .md 路径")

    args = parser.parse_args()

    if args.command == "to-json":
        with open(args.input, "r", encoding="utf-8") as f:
            text = f.read()
        data = parse_md(text)
        output = json.dumps(data, ensure_ascii=False, indent=2)
        if args.output:
            os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"Converted: {args.input} → {args.output}")
        else:
            print(output)

    elif args.command == "to-md":
        with open(args.input, "r", encoding="utf-8") as f:
            data = json.load(f)
        output = to_md(data)
        if args.output:
            os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(output)
            print(f"Converted: {args.input} → {args.output}")
        else:
            print(output)


if __name__ == "__main__":
    main()
