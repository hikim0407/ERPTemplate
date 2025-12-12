import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

export type UserRecord = {
  id: string
  name: string
  email: string
  role: string
  useYn: boolean
  remark?: string
  password?: string
  updatedAt?: string
}

type UserData = {
  users: UserRecord[]
}

const dataPath = path.join(process.cwd(), "src", "data", "users.json")

const seedUsers: UserRecord[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    useYn: true,
    remark: "Seed admin",
    password: "password123",
  },
  {
    id: "2",
    email: "user@example.com",
    name: "Normal User",
    role: "user",
    useYn: true,
    remark: "Seed user",
    password: "password123",
  },
]

async function ensureDataFile() {
  try {
    await fs.access(dataPath)
  } catch {
    const initial: UserData = { users: seedUsers }
    await fs.mkdir(path.dirname(dataPath), { recursive: true })
    await fs.writeFile(dataPath, JSON.stringify(initial, null, 2), "utf-8")
  }
}

async function readData(): Promise<UserData> {
  await ensureDataFile()
  const raw = await fs.readFile(dataPath, "utf-8")
  const parsed = JSON.parse(raw)
  return {
    users: parsed.users || [],
  }
}

async function writeData(data: UserData) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true })
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8")
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

export async function listUsers() {
  const data = await readData()
  return data.users
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name) || a.email.localeCompare(b.email))
}

export async function getUser(id: string) {
  const data = await readData()
  return data.users.find((u) => u.id === id) || null
}

export async function getUserByEmail(email: string) {
  const data = await readData()
  const normalized = normalizeEmail(email)
  return data.users.find((u) => normalizeEmail(u.email) === normalized) || null
}

type UpsertInput = {
  id?: string
  name: string
  email: string
  role: string
  useYn?: boolean
  remark?: string
  password?: string
}

export async function upsertUser(payload: UpsertInput) {
  if (!payload.name?.trim() || !payload.email?.trim() || !payload.role?.trim()) {
    throw new Error("name, email, and role are required")
  }

  const now = new Date().toISOString()
  const data = await readData()

  const email = normalizeEmail(payload.email)
  const id = payload.id?.trim() || crypto.randomUUID()
  const existingIndex = data.users.findIndex((u) => u.id === id)

  // Check email uniqueness (ignore the same record)
  const duplicate = data.users.find(
    (u) => normalizeEmail(u.email) === email && u.id !== id
  )
  if (duplicate) {
    throw new Error("Email already exists")
  }

  const nextRecord: UserRecord = {
    id,
    name: payload.name.trim(),
    email,
    role: payload.role.trim(),
    useYn: payload.useYn !== false,
    remark: payload.remark?.trim() || "",
    password: payload.password?.trim() || (existingIndex >= 0 ? data.users[existingIndex].password : undefined),
    updatedAt: now,
  }

  if (existingIndex >= 0) {
    data.users[existingIndex] = nextRecord
  } else {
    data.users.push(nextRecord)
  }

  await writeData(data)
  return nextRecord
}

export async function deleteUser(id: string) {
  const data = await readData()
  const before = data.users.length
  data.users = data.users.filter((u) => u.id !== id)
  if (before === data.users.length) return { deleted: false }
  await writeData(data)
  return { deleted: true }
}
