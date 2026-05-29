from pydantic import BaseModel
from typing import Optional


class RoleOption(BaseModel):
    value: str
    label: str
    desc: str
    color: Optional[str] = None


class SiteInfo(BaseModel):
    title: str
    description: str
    roles: list[RoleOption] = []


class TimeNodeOut(BaseModel):
    name: Optional[str] = None
    deadline: Optional[str] = None
    remark: Optional[str] = None
    applies_to: str = "all"


class SubTaskOut(BaseModel):
    title: str
    applies_to: str
    sort_order: int = 0


class SubFileOut(BaseModel):
    name: str
    format: Optional[str] = None
    naming_rule: Optional[str] = None
    description: Optional[str] = None
    applies_to: str
    sort_order: int = 0


class TaskOut(BaseModel):
    title: str
    applies_to: str
    notes: list[str] = []
    sub_tasks: list[SubTaskOut] = []
    sub_files: list[SubFileOut] = []
    time_nodes: list[TimeNodeOut] = []
    sort_order: int = 0


class PhaseOut(BaseModel):
    title: str
    description: Optional[str] = None
    tasks: list[TaskOut] = []
    sort_order: int = 0


class FullDataResponse(BaseModel):
    site: SiteInfo
    phases: list[PhaseOut]
    updated_at: str
