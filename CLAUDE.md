# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

厦门大学信息学院研究生毕业论文流程跟踪系统。前端 React SPA + 后端 FastAPI 数据源，支持 PWA 安装和离线运行。

## Commands

```bash
# 依赖安装（pixi 统一管理 Python + Node.js）
pixi install
pixi run frontend-install

# 开发（后端 FastAPI + 前端 Vite HMR，同时运行）
pixi run dev
# 前端: http://localhost:3000（proxy /api → :8000）
# 后端: http://127.0.0.1:8000

# 单独启动后端（自动热重载）
pixi run backend

# 构建前端
pixi run frontend-build

# 数据库操作
pixi run seed                    # 从 seed_data.py 初始化 DB
pixi run db-export               # DB → data/tracker.json
pixi run db-import               # data/tracker.json → DB

# Markdown 双向转换
pixi run md2json -- data/tracker.md -o data/tracker.json
pixi run json2md -- data/tracker.json -o data/tracker.md
```

## Architecture

### 数据流

```
seed_data.py → seed → SQLite DB
tracker.json ←→ db_tool ←→ SQLite DB
tracker.md   ←→ md_tool ←→ tracker.json
                    ↓
              FastAPI /api/data → 前端加载 → localStorage 缓存
```

后端 API 是**只读数据源**，读取 `backend/data/tracker.json` 返回数据。前端加载后可离线运行，用户进度存储在 localStorage。

### 后端 (`backend/app/`)

- `routers/data.py` — 唯一 API：`GET /api/data`（读 tracker.json）和 `GET /api/data/updated_at`
- `schemas.py` — Pydantic 响应模型，`FullDataResponse` 包含 `site` + `phases` + `updated_at`
- `md_tool.py` — 自定义 Markdown ↔ JSON 双向转换（格式规范见 `docs/tracker-md-format.md`）
- `db_tool.py` — SQLite ↔ JSON 双向转换
- `seed_data.py` — 完整流程种子数据（site + phases + tasks + sub_tasks + sub_files + time_nodes）

### 前端 (`frontend/src/`)

- `store/useStore.ts` — 全局状态：数据加载、进度管理（localStorage）、服务器连接
- `api/client.ts` — API 封装：默认尝试 `http://localhost:8000`，缓存到 localStorage
- `types/index.ts` — 核心类型：`FullData > SiteInfo > Phase > Task > SubTask/SubFile/TimeNode`
- `App.tsx` — 三栏布局：左侧目录(Sidebar) / 中间内容 / 右侧时间轴(Timeline) + 悬浮按钮

### 关键设计决策

- **任务标识**：使用 `taskKey(title)` 函数（在 types/index.ts）通过任务标题生成进度 key，而非数字 ID。这是因为进度存储在 localStorage，数据可能从不同来源导入导致 ID 不一致
- **身份过滤**：`applies_to` 字段贯穿 Task、SubTask、SubFile、TimeNode 四层，前端统一按 role 过滤
- **子任务联动**：勾选父任务自动完成所有子任务/子文件；所有子任务/子文件完成时自动标记父任务完成
- **Markdown 渲染**：注意事项使用 `react-markdown` + `remark-breaks` 渲染，`**加粗**` 显示为 amber 高亮样式

### 自定义 Markdown 格式

```
# 站点标题
站点描述

> ROLE doctor 博士 学术型博士研究生 purple

## 一、阶段标题
阶段描述

### 任务名称 [applies_to]
注意事项段落（支持 Markdown 内联格式）

- [applies_to] 子任务内容
- 文件名 [applies_to]
  - 格式: PDF
  - 命名: 规则
  - 描述
- @名称 时间 [applies_to] 备注
```

完整规范见 `docs/tracker-md-format.md`。
