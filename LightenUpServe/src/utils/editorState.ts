export type SafeAreaConfig = {
  enabled: boolean
  visible: boolean
  top: number
  right: number
  bottom: number
  left: number
  color?: string
}

export type ProjectData = {
  layers: any[]
  safeArea: SafeAreaConfig
}

export const DEFAULT_SAFE_AREA: SafeAreaConfig = {
  enabled: true,
  visible: true,
  top: 50,
  right: 50,
  bottom: 50,
  left: 50,
  color: '#00bfff',
}

export function defaultProjectData(): ProjectData {
  return { layers: [], safeArea: { ...DEFAULT_SAFE_AREA } }
}

export function parseStateJson(input: unknown): ProjectData {
  const value = typeof input === 'string' ? safeJsonParse(input) : input
  if (!value || typeof value !== 'object') return defaultProjectData()

  const anyVal = value as any
  const layers = Array.isArray(anyVal.layers) ? anyVal.layers : []
  const safeArea = normalizeSafeArea(anyVal.safeArea)
  return normalizeProjectData({ layers, safeArea })
}

export function normalizeProjectData(data: ProjectData): ProjectData {
  const layers = Array.isArray(data.layers) ? data.layers : []
  const safeArea = normalizeSafeArea(data.safeArea)
  const normalizedLayers = layers.map((layer) => normalizeLayer(layer)).filter(Boolean)
  return { layers: normalizedLayers, safeArea }
}

export function buildStateFromStructured(params: {
  canvas: { safe_top?: any; safe_right?: any; safe_bottom?: any; safe_left?: any }
  groups: Array<{ id: string; name?: string; locked?: any }>
  nodes: Array<{
    id: string
    type: string
    x: any
    y: any
    width: any
    height: any
    rotation: any
    z_index: any
    locked?: any
    group_id?: string | null
    props?: any
  }>
}): ProjectData {
  const safeArea: SafeAreaConfig = {
    enabled: true,
    visible: true,
    top: toNumber(params.canvas.safe_top) ?? DEFAULT_SAFE_AREA.top,
    right: toNumber(params.canvas.safe_right) ?? DEFAULT_SAFE_AREA.right,
    bottom: toNumber(params.canvas.safe_bottom) ?? DEFAULT_SAFE_AREA.bottom,
    left: toNumber(params.canvas.safe_left) ?? DEFAULT_SAFE_AREA.left,
    color: DEFAULT_SAFE_AREA.color,
  }

  const nodes = params.nodes || []
  const groups = params.groups || []

  const childrenByGroupId = new Map<string, any[]>()
  for (const n of nodes) {
    const gid = n.group_id || null
    if (!gid) continue
    const list = childrenByGroupId.get(gid) || []
    list.push(n)
    childrenByGroupId.set(gid, list)
  }

  for (const [gid, list] of childrenByGroupId.entries()) {
    list.sort((a, b) => (toNumber(a.z_index) ?? 0) - (toNumber(b.z_index) ?? 0))
    childrenByGroupId.set(gid, list)
  }

  const layers: any[] = []

  const topLevelNodes = nodes
    .filter((n) => !n.group_id)
    .sort((a, b) => (toNumber(a.z_index) ?? 0) - (toNumber(b.z_index) ?? 0))

  for (const n of topLevelNodes) {
    const nodeProps = sanitizeFabricProps(n.props || {})
    layers.push({
      id: n.id,
      type: n.type,
      name: getLayerName(n.type, nodeProps, n.id),
      locked: toBool(n.locked),
      visible: true,
      zIndex: toNumber(n.z_index) ?? 0,
      isGroup: false,
      children: [],
      fabricObject: {
        type: mapNodeTypeToFabricType(n.type),
        left: toNumber(n.x) ?? 0,
        top: toNumber(n.y) ?? 0,
        width: toNumber(n.width) ?? 0,
        height: toNumber(n.height) ?? 0,
        angle: toNumber(n.rotation) ?? 0,
        ...nodeProps,
      },
    })
  }

  for (const g of groups) {
    const children = childrenByGroupId.get(g.id) || []
    if (children.length === 0) continue

    const objects = children.map((child: any) => {
      const childProps = sanitizeFabricProps(child.props || {})
      return {
        type: mapNodeTypeToFabricType(child.type),
        left: toNumber(child.x) ?? 0,
        top: toNumber(child.y) ?? 0,
        width: toNumber(child.width) ?? 0,
        height: toNumber(child.height) ?? 0,
        angle: toNumber(child.rotation) ?? 0,
        data: {
          id: child.id,
          layerType: child.type,
          locked: toBool(child.locked),
          name: getLayerName(child.type, childProps, child.id),
        },
        ...childProps,
      }
    })

    layers.push({
      id: g.id,
      type: 'group',
      name: g.name || '组',
      locked: toBool(g.locked),
      visible: true,
      zIndex: 999,
      isGroup: true,
      children: [],
      fabricObject: {
        type: 'group',
        objects,
      },
    })
  }

  layers.sort((a, b) => (toNumber(a.zIndex) ?? 0) - (toNumber(b.zIndex) ?? 0))
  return normalizeProjectData({ layers, safeArea })
}

function normalizeSafeArea(input: any): SafeAreaConfig {
  if (!input || typeof input !== 'object') return { ...DEFAULT_SAFE_AREA }
  return {
    enabled: toBool(input.enabled ?? DEFAULT_SAFE_AREA.enabled),
    visible: toBool(input.visible ?? DEFAULT_SAFE_AREA.visible),
    top: toNumber(input.top) ?? DEFAULT_SAFE_AREA.top,
    right: toNumber(input.right) ?? DEFAULT_SAFE_AREA.right,
    bottom: toNumber(input.bottom) ?? DEFAULT_SAFE_AREA.bottom,
    left: toNumber(input.left) ?? DEFAULT_SAFE_AREA.left,
    color: typeof input.color === 'string' ? input.color : DEFAULT_SAFE_AREA.color,
  }
}

function normalizeLayer(layer: any): any | null {
  if (!layer || typeof layer !== 'object') return null
  const out = { ...layer }
  out.zIndex = toNumber(out.zIndex) ?? 0
  out.locked = toBool(out.locked)
  out.visible = out.visible === undefined ? true : toBool(out.visible)
  out.isGroup = toBool(out.isGroup || out.type === 'group')
  if (out.fabricObject && typeof out.fabricObject === 'object') {
    out.fabricObject = normalizeFabricObject(out.fabricObject)
  }
  return out
}

function normalizeFabricObject(obj: any): any {
  const clean = sanitizeFabricProps(obj)
  if (clean.left !== undefined) clean.left = toNumber(clean.left) ?? 0
  if (clean.top !== undefined) clean.top = toNumber(clean.top) ?? 0
  if (clean.width !== undefined) clean.width = toNumber(clean.width) ?? 0
  if (clean.height !== undefined) clean.height = toNumber(clean.height) ?? 0
  if (clean.angle !== undefined) clean.angle = toNumber(clean.angle) ?? 0

  if (Array.isArray(clean.objects)) {
    clean.objects = clean.objects.map((child: any) => normalizeFabricObject(child)).filter(Boolean)
  }

  return clean
}

function sanitizeFabricProps(props: any): any {
  if (!props || typeof props !== 'object') return {}
  const clean: any = Array.isArray(props) ? props.slice() : { ...props }

  if (clean.strokeDashArray && !Array.isArray(clean.strokeDashArray)) {
    clean.strokeDashArray = null
  }

  if (clean.shadow && typeof clean.shadow === 'object' && !Array.isArray(clean.shadow) && Object.keys(clean.shadow).length === 0) {
    clean.shadow = null
  }

  if (clean.path && typeof clean.path === 'object' && !Array.isArray(clean.path) && Object.keys(clean.path).length === 0) {
    clean.path = null
  }

  if (clean.stroke && typeof clean.stroke === 'object' && !Array.isArray(clean.stroke) && Object.keys(clean.stroke).length === 0) {
    clean.stroke = null
  }

  return clean
}

function getLayerName(type: string, props: any, fallbackId: string): string {
  const fromData = props?.data?.name
  if (typeof fromData === 'string' && fromData.trim()) return fromData
  const fromText = props?.text
  if (typeof fromText === 'string' && fromText.trim()) return fromText
  if (type === 'text') return '文本'
  if (type === 'image') return '图片'
  if (type === 'background') return '背景'
  return fallbackId
}

function mapNodeTypeToFabricType(type: string): string {
  if (type === 'text') return 'i-text'
  if (type === 'image') return 'image'
  return type
}

function toNumber(v: any): number | null {
  if (v === null || v === undefined) return null
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

function toBool(v: any): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v !== '0' && v.toLowerCase() !== 'false' && v !== ''
  return !!v
}

function safeJsonParse(input: string): any {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}

