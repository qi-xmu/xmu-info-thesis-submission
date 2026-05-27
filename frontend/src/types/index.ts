export interface TimeNode {
  id: number
  name: string | null
  deadline: string | null
  remark: string | null
}

export interface SubTask {
  id: number
  title: string
  applies_to: string
}

export interface SubFile {
  id: number
  name: string
  format: string | null
  naming_rule: string | null
  description: string | null
  applies_to: string
}

export interface Task {
  id: number
  title: string
  applies_to: string
  notes: string[]
  sub_tasks: SubTask[]
  sub_files: SubFile[]
  time_nodes: TimeNode[]
}

export interface Phase {
  id: number
  title: string
  description: string | null
  tasks: Task[]
}

export interface FullData {
  phases: Phase[]
  updated_at: string
}

export type RoleFilter = 'all' | 'doctor' | 'master' | 'professional'

export interface ProgressMap {
  [key: string]: boolean
}
