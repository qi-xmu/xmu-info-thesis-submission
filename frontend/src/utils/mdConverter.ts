import type { FullData, Phase, Task, SubFile, RoleOption } from '../types'

// ──────────────────────────── JSON → MD ────────────────────────────

export function jsonToMd(data: FullData): string {
  const lines: string[] = []
  const site = data.site

  lines.push(`# ${site.title}`)
  lines.push('')
  lines.push(site.description || '')
  lines.push('')

  for (const role of site.roles) {
    const parts = [role.value, role.label || role.value]
    if (role.desc) parts.push(role.desc)
    if (role.color) parts.push(role.color)
    lines.push(`> ROLE ${parts.join(' ')}`)
  }
  lines.push('')

  for (const phase of data.phases) {
    lines.push(`## ${phase.title}`)
    if (phase.description) {
      lines.push(phase.description)
    }
    lines.push('')

    for (const task of phase.tasks) {
      lines.push(`### ${task.title} [${task.applies_to || 'all'}]`)
      lines.push('')

      for (const note of task.notes) {
        lines.push(note)
        lines.push('')
      }

      for (const st of task.sub_tasks) {
        lines.push(`- [${st.applies_to || 'all'}] ${st.title}`)
      }
      if (task.sub_tasks.length > 0) {
        lines.push('')
      }

      for (const sf of task.sub_files) {
        lines.push(`- ${sf.name} [${sf.applies_to || 'all'}]`)
        if (sf.format) lines.push(`  - 格式: ${sf.format}`)
        if (sf.naming_rule) lines.push(`  - 命名: ${sf.naming_rule}`)
        if (sf.description) lines.push(`  - ${sf.description}`)
      }
      if (task.sub_files.length > 0) {
        lines.push('')
      }

      for (const tn of task.time_nodes) {
        const remark = tn.remark ? ` ${tn.remark}` : ''
        lines.push(`- @${tn.name} ${tn.deadline} [${tn.applies_to || 'all'}]${remark}`)
      }
      if (task.time_nodes.length > 0) {
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

// ──────────────────────────── MD → JSON ────────────────────────────

type LineType = 'empty' | 'h1' | 'role' | 'task_header' | 'phase' | 'content'

function getLineType(line: string): LineType {
  const s = line.trim()
  if (!s) return 'empty'
  if (s.startsWith('# ') && !s.startsWith('## ')) return 'h1'
  if (s.startsWith('> ROLE')) return 'role'
  if (s.startsWith('### ')) return 'task_header'
  if (s.startsWith('## ')) return 'phase'
  return 'content'
}

export function mdToJson(text: string): FullData {
  const lines = text.split('\n')
  const result: FullData = {
    site: { title: '', description: '', roles: [] },
    phases: [],
    updated_at: new Date().toISOString(),
  }
  let i = 0

  function readParagraph(start: number, stopTypes: Set<LineType>): [string[], number] {
    const parts: string[] = []
    let j = start
    let prevEmpty = false

    while (j < lines.length) {
      const lt = getLineType(lines[j])
      if (stopTypes.has(lt)) break
      if (lt === 'empty') {
        prevEmpty = true
        j++
        continue
      }
      if (prevEmpty && parts.length > 0) {
        parts.push('')
      }
      parts.push(lines[j].trim())
      prevEmpty = false
      j++
    }
    return [parts, j]
  }

  // 解析 site.title
  while (i < lines.length && getLineType(lines[i]) !== 'h1') i++
  if (i < lines.length) {
    result.site.title = lines[i].trim().slice(2).trim()
    i++
  }

  // 解析 site.description
  const [descParts, newI1] = readParagraph(i, new Set(['role', 'phase']))
  result.site.description = descParts.join('\n')
  i = newI1

  // 解析 roles
  while (i < lines.length && getLineType(lines[i]) === 'role') {
    const parts = lines[i].trim().slice('> ROLE'.length).trim().split(/\s+/)
    const role: RoleOption = {
      value: parts[0],
      label: parts[1] || parts[0],
      desc: parts[2] || '',
    }
    if (parts[2]) role.desc = parts[2]
    if (parts[3]) role.color = parts[3]
    result.site.roles.push(role)
    i++
  }

  // 解析 phases
  while (i < lines.length) {
    while (i < lines.length && getLineType(lines[i]) === 'empty') i++
    if (i >= lines.length) break

    if (getLineType(lines[i]) !== 'phase') {
      i++
      continue
    }

    const phase: Phase = {
      title: lines[i].trim().slice(3).trim(),
      sort_order: result.phases.length + 1,
      description: null,
      tasks: [],
    }
    i++

    // 阶段描述
    const [phaseDesc, newI2] = readParagraph(i, new Set(['task_header', 'phase']))
    phase.description = phaseDesc.join('\n') || null
    i = newI2

    result.phases.push(phase)

    // 解析该阶段下的任务
    while (i < lines.length) {
      while (i < lines.length && getLineType(lines[i]) === 'empty') i++
      if (i >= lines.length || getLineType(lines[i]) === 'phase' || getLineType(lines[i]) === 'h1' || getLineType(lines[i]) === 'role') break

      if (getLineType(lines[i]) !== 'task_header') {
        i++
        continue
      }

      const m = lines[i].trim().match(/^###\s+(.+?)\s+\[(\w+)\]\s*$/)
      if (!m) {
        i++
        continue
      }

      const task: Task = {
        title: m[1].trim(),
        applies_to: m[2],
        notes: [],
        sub_tasks: [],
        sub_files: [],
        time_nodes: [],
        sort_order: phase.tasks.length + 1,
      }
      phase.tasks.push(task)
      i++

      // 解析任务内部
      while (i < lines.length) {
        const lt = getLineType(lines[i])
        const s = lines[i].trim()

        if (lt === 'task_header' || lt === 'phase' || lt === 'h1' || lt === 'role') break
        if (lt === 'empty') {
          i++
          continue
        }

        // 时间节点: - @name deadline [applies_to] remark
        const tm = s.match(/^-\s+@(.+?)\s+(\S+)\s+\[(\w+)\]\s*(.*)$/)
        if (tm) {
          task.time_nodes.push({
            name: tm[1].trim(),
            deadline: tm[2].trim(),
            applies_to: tm[3],
            remark: tm[4].trim() || null,
          })
          i++
          continue
        }

        // 子文件: - 文件名 [applies_to] + 缩进块
        const sfm = s.match(/^-\s+(.+?)\s+\[(\w+)\]\s*$/)
        if (sfm && !s.startsWith('- 格式:') && !s.startsWith('- 命名:')) {
          const sf: SubFile = {
            name: sfm[1].trim(),
            applies_to: sfm[2],
            format: null,
            naming_rule: null,
            description: null,
            sort_order: task.sub_files.length,
          }
          i++
          const descParts: string[] = []
          while (i < lines.length) {
            const sl = lines[i]
            const ss = sl.trim()
            if (!sl.startsWith('  ') && !sl.startsWith('\t')) break
            const field = ss.replace(/^-\s+/, '').trim()
            if (field.startsWith('格式:')) sf.format = field.slice(3).trim() || null
            else if (field.startsWith('命名:')) sf.naming_rule = field.slice(3).trim() || null
            else if (field) descParts.push(field)
            i++
          }
          if (descParts.length > 0) sf.description = descParts.join('\n')
          task.sub_files.push(sf)
          continue
        }

        // 子任务: - [applies_to] 内容
        const stm = s.match(/^-\s+\[(\w+)\]\s+(.+)$/)
        if (stm) {
          task.sub_tasks.push({
            title: stm[2].trim(),
            applies_to: stm[1],
            sort_order: task.sub_tasks.length,
          })
          i++
          continue
        }

        // 普通段落行 → notes
        const paraParts: string[] = []
        while (i < lines.length) {
          const lt2 = getLineType(lines[i])
          const s2 = lines[i].trim()
          if (lt2 === 'task_header' || lt2 === 'phase' || lt2 === 'h1' || lt2 === 'role' || lt2 === 'empty') break
          if (s2.match(/^-\s+@/) || s2.match(/^-\s+\[\w+\]/) || s2.match(/^-\s+.+\[\w+\]\s*$/)) break
          paraParts.push(s2)
          i++
        }
        if (paraParts.length > 0) task.notes.push(paraParts.join('\n'))
      }
    }
  }

  return result
}
