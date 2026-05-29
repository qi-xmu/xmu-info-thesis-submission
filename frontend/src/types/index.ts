export interface RoleOption {
  value: string
  label: string
  desc: string
  color?: string
}

export interface SiteInfo {
  title: string
  description: string
  roles: RoleOption[]
}

export interface TimeNode {
  name: string | null
  deadline: string | null
  remark: string | null
  applies_to: string
}

export interface SubTask {
  title: string
  applies_to: string
  sort_order: number
}

export interface SubFile {
  name: string
  format: string | null
  naming_rule: string | null
  description: string | null
  applies_to: string
  sort_order: number
}

export interface Task {
  title: string
  applies_to: string
  notes: string[]
  sub_tasks: SubTask[]
  sub_files: SubFile[]
  time_nodes: TimeNode[]
  sort_order: number
}

export interface Phase {
  title: string
  description: string | null
  tasks: Task[]
  sort_order: number
}

export interface FullData {
  site: SiteInfo
  phases: Phase[]
  updated_at: string
}

export type RoleFilter = 'all' | 'doctor' | 'master' | 'professional'

export interface ProgressMap {
  [key: string]: boolean
}

export function taskKey(taskTitle: string): string {
  return taskTitle
}

export function subTaskKey(taskTitle: string, subTitle: string): string {
  return `st:${taskTitle}:${subTitle}`
}

export function subFileKey(taskTitle: string, fileName: string): string {
  return `sf:${taskTitle}:${fileName}`
}

export function domId(title: string): string {
  return `t-${title}`
}
