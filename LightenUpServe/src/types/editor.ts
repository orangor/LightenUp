export interface Project {
  id: string
  user_id: number
  name: string
  status: 'active' | 'archived'
  created_at: Date
  updated_at: Date
}

export interface Canvas {
  id: string
  project_id: string
  name: string
  width: number
  height: number
  safe_top: number
  safe_right: number
  safe_bottom: number
  safe_left: number
  state_json?: any
  state_version?: number
  updated_at?: Date
  created_at: Date
}

export interface Group {
  id: string
  project_id: string
  name: string
  locked: boolean
}

export interface Node {
  id: string
  project_id: string
  canvas_id: string
  type: 'image' | 'text' | 'shape' | 'group'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  z_index: number
  locked: boolean
  group_id: string | null
  props: Record<string, any>
  created_at: Date
  updated_at: Date
}

export interface ProjectFullSnapshot {
  project: Project
  canvases: Canvas[]
  groups: Group[]
  nodes: Node[]
}

export interface SaveProjectRequest {
  canvases: Omit<Canvas, 'project_id' | 'created_at'>[]
  groups: Omit<Group, 'project_id'>[]
  nodes: Omit<Node, 'project_id' | 'created_at' | 'updated_at'>[]
}
