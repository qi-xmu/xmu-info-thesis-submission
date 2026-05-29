# 厦门大学信息学院研究生毕业论文流程跟踪系统

基于 React + FastAPI 的论文流程跟踪系统，帮助研究生追踪毕业论文各阶段任务进度。

## 功能特性

- **任务转轮**：智能任务调度，按顺序展示当前任务和下一个任务
- **多角色支持**：博士、学术硕士、专业硕士，自动筛选相关任务
- **进度追踪**：支持主任务、子任务、子文件三级进度追踪
- **深色模式**：支持浅色/深色主题切换，自动检测系统偏好
- **数据导入导出**：支持 JSON 格式数据导入导出
- **服务器同步**：可连接后端服务器获取最新任务数据

## 快速开始

### 环境要求

- [pixi](https://pixi.sh/) - 包管理工具
- Node.js >= 20
- Python >= 3.11

### 安装与运行

```bash
# 克隆项目
git clone https://github.com/your-username/xmu-info-thesis-submission.git
cd xmu-info-thesis-submission

# 安装依赖
pixi install
pixi run frontend-install

# 启动开发服务器（前端 + 后端）
pixi run dev
```

访问 http://localhost:3000

### 单独启动

```bash
# 启动后端 (http://localhost:8000)
pixi run backend

# 启动前端 (http://localhost:3000)
pixi run frontend-dev
```

## 数据管理

### Markdown ↔ JSON 转换

```bash
# Markdown → JSON
pixi run md2json -- data/tracker.md -o data/tracker.json

# JSON → Markdown
pixi run json2md -- data/tracker.json -o data/tracker.md
```

### 数据格式

任务数据存储在 `backend/data/tracker.json`，格式如下：

```json
{
  "site": {
    "title": "站点标题",
    "description": "站点描述",
    "roles": [...]
  },
  "phases": [
    {
      "title": "阶段标题",
      "tasks": [
        {
          "title": "任务标题",
          "applies_to": "all|doctor|master|professional",
          "notes": ["注意事项"],
          "sub_tasks": [...],
          "sub_files": [...],
          "time_nodes": [...]
        }
      ]
    }
  ]
}
```

## 项目结构

```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── routers/data.py  # API 路由
│   │   ├── schemas.py       # Pydantic 模型
│   │   └── md_tool.py       # Markdown ↔ JSON 转换
│   └── data/
│       ├── tracker.json     # 任务数据
│       └── tracker.md       # Markdown 格式数据
├── frontend/
│   └── src/
│       ├── App.tsx          # 主组件
│       ├── components/      # UI 组件
│       ├── store/           # 状态管理
│       └── types/           # TypeScript 类型
└── pixi.toml               # 项目配置
```

## 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS
- **后端**：FastAPI + Pydantic
- **数据**：JSON 文件存储
- **构建**：Vite
- **包管理**：pixi + npm

## 浏览器支持

- Chrome / Edge >= 90
- Firefox >= 90
- Safari >= 15

## License

MIT
