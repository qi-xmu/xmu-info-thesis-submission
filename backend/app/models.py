from sqlalchemy import Column, Integer, Text, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from .database import Base


class Phase(Base):
    __tablename__ = "phases"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(Text, nullable=False)
    description = Column(Text)
    sort_order = Column(Integer, default=0)

    tasks = relationship("Task", back_populates="phase", order_by="Task.sort_order")


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    phase_id = Column(Integer, ForeignKey("phases.id"), nullable=False)
    title = Column(Text, nullable=False)
    applies_to = Column(Text, default="all")
    notes = Column(JSON, default=list)
    sort_order = Column(Integer, default=0)

    phase = relationship("Phase", back_populates="tasks")
    time_nodes = relationship("TimeNode", back_populates="task")
    sub_tasks = relationship("SubTask", back_populates="task", order_by="SubTask.sort_order")
    sub_files = relationship("SubFile", back_populates="task", order_by="SubFile.sort_order")


class TimeNode(Base):
    __tablename__ = "time_nodes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    name = Column(Text)
    deadline = Column(Text)
    remark = Column(Text)

    task = relationship("Task", back_populates="time_nodes")


class SubTask(Base):
    __tablename__ = "sub_tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    title = Column(Text, nullable=False)
    applies_to = Column(Text, default="all")
    sort_order = Column(Integer, default=0)

    task = relationship("Task", back_populates="sub_tasks")


class SubFile(Base):
    __tablename__ = "sub_files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=False)
    name = Column(Text, nullable=False)
    format = Column(Text)
    naming_rule = Column(Text)
    description = Column(Text)
    applies_to = Column(Text, default="all")
    sort_order = Column(Integer, default=0)

    task = relationship("Task", back_populates="sub_files")
