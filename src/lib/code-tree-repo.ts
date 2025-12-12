import fs from "fs/promises"
import path from "path"

export type CodeNode = {
  code: string
  name: string
  parentCode: string | null
  depth: number
  sortOrder: number
  useYn: boolean
  remark?: string
  updatedAt?: string
}

type CodeTreeData = {
  codes: CodeNode[]
}

const dataPath = path.join(process.cwd(), "src", "data", "code-tree.json")

async function ensureDataFile() {
  try {
    await fs.access(dataPath)
  } catch {
    const initial: CodeTreeData = { codes: [] }
    await fs.mkdir(path.dirname(dataPath), { recursive: true })
    await fs.writeFile(dataPath, JSON.stringify(initial, null, 2), "utf-8")
  }
}

async function readData(): Promise<CodeTreeData> {
  await ensureDataFile()
  const raw = await fs.readFile(dataPath, "utf-8")
  const parsed = JSON.parse(raw)
  return {
    codes: parsed.codes || [],
  }
}

async function writeData(data: CodeTreeData) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true })
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8")
}

const sortNodes = (nodes: CodeNode[]) =>
  nodes
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.code.localeCompare(b.code))

export async function listByDepth(depth: number) {
  const data = await readData()
  return sortNodes(data.codes.filter((c) => c.depth === depth))
}

export async function listChildren(parentCode: string | null) {
  const data = await readData()
  return sortNodes(data.codes.filter((c) => c.parentCode === parentCode))
}

export async function getWithChildren(code: string) {
  const data = await readData()
  const node = data.codes.find((c) => c.code === code)
  const children = sortNodes(data.codes.filter((c) => c.parentCode === code))
  return { node, children }
}

export async function upsertCodes(nodes: CodeNode[]) {
  if (!nodes.length) return { saved: [] as CodeNode[] }
  const now = new Date().toISOString()

  const normalized = nodes.map((n, idx) => ({
    ...n,
    code: n.code.trim().toUpperCase(),
    name: n.name.trim(),
    parentCode: n.parentCode ? n.parentCode.trim().toUpperCase() : null,
    depth: Number(n.depth) || 1,
    sortOrder: Number(n.sortOrder ?? idx + 1) || idx + 1,
    useYn: Boolean(n.useYn),
    updatedAt: now,
  }))

  // duplicate detection within payload
  const seen = new Set<string>()
  for (const n of normalized) {
    if (seen.has(n.code)) {
      throw new Error(`Duplicate code in payload: ${n.code}`)
    }
    seen.add(n.code)
  }

  const data = await readData()

  // ensure parent existence check: we allow missing parent in data (it may be in payload)
  const payloadCodes = new Set(normalized.map((n) => n.code))

  const codeExistsOrInPayload = (code: string | null) => {
    if (code === null) return true
    return payloadCodes.has(code) || data.codes.some((c) => c.code === code)
  }

  for (const n of normalized) {
    if (!codeExistsOrInPayload(n.parentCode)) {
      throw new Error(`Parent code not found: ${n.parentCode}`)
    }
  }

  // upsert
  for (const n of normalized) {
    const idx = data.codes.findIndex((c) => c.code === n.code)
    if (idx >= 0) {
      data.codes[idx] = { ...data.codes[idx], ...n }
    } else {
      data.codes.push(n)
    }
  }

  await writeData(data)
  return { saved: normalized }
}

export async function deleteWithDescendants(code: string) {
  const target = code.trim().toUpperCase()
  const data = await readData()

  // build adjacency map
  const childrenMap = new Map<string | null, string[]>()
  for (const c of data.codes) {
    const key = c.parentCode
    const list = childrenMap.get(key) || []
    list.push(c.code)
    childrenMap.set(key, list)
  }

  const toDelete = new Set<string>()
  const stack = [target]
  while (stack.length) {
    const cur = stack.pop()!
    if (toDelete.has(cur)) continue
    toDelete.add(cur)
    const kids = childrenMap.get(cur) || []
    for (const k of kids) stack.push(k)
  }

  const before = data.codes.length
  data.codes = data.codes.filter((c) => !toDelete.has(c.code))

  if (before === data.codes.length) {
    return { deleted: false }
  }

  await writeData(data)
  return { deleted: true, count: before - data.codes.length }
}
