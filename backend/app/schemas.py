from pydantic import BaseModel
from typing import Optional


class TimeNodeOut(BaseModel):
    id: int
    name: Optional[str] = None
    deadline: Optional[str] = None
    remark: Optional[str] = None

    model_config = {"from_attributes": True}


class SubTaskOut(BaseModel):
    id: int
    title: str
    applies_to: str

    model_config = {"from_attributes": True}


class SubFileOut(BaseModel):
    id: int
    name: str
    format: Optional[str] = None
    naming_rule: Optional[str] = None
    description: Optional[str] = None
    applies_to: str

    model_config = {"from_attributes": True}


class TaskOut(BaseModel):
    id: int
    title: str
    applies_to: str
    notes: list[str]
    sub_tasks: list[SubTaskOut] = []
    sub_files: list[SubFileOut] = []
    time_nodes: list[TimeNodeOut] = []

    model_config = {"from_attributes": True}


class PhaseOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    tasks: list[TaskOut] = []

    model_config = {"from_attributes": True}


class FullDataResponse(BaseModel):
    phases: list[PhaseOut]
    updated_at: str
