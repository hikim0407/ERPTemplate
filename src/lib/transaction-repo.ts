import fs from "fs/promises"
import path from "path"
import crypto from "crypto"

export type TransactionRecord = {
  id: string
  date: string
  amount: number
  categoryCode: string
  memo?: string
  createdAt: string
}

type TransactionData = {
  transactions: TransactionRecord[]
}

const dataPath = path.join(process.cwd(), "src", "data", "transactions.json")

async function ensureDataFile() {
  try {
    await fs.access(dataPath)
  } catch {
    const initial: TransactionData = { transactions: [] }
    await fs.mkdir(path.dirname(dataPath), { recursive: true })
    await fs.writeFile(dataPath, JSON.stringify(initial, null, 2), "utf-8")
  }
}

async function readData(): Promise<TransactionData> {
  await ensureDataFile()
  const raw = await fs.readFile(dataPath, "utf-8")
  const parsed = JSON.parse(raw)
  return {
    transactions: parsed.transactions || [],
  }
}

async function writeData(data: TransactionData) {
  await fs.mkdir(path.dirname(dataPath), { recursive: true })
  await fs.writeFile(dataPath, JSON.stringify(data, null, 2), "utf-8")
}

type CreateInput = {
  date: string
  amount: number
  categoryCode: string
  memo?: string
}

const isValidDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)

export async function listTransactions(limit = 50) {
  const data = await readData()
  const items = data.transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  return items.slice(0, Math.max(1, limit))
}

export async function createTransaction(payload: CreateInput) {
  if (!payload.date?.trim() || !isValidDate(payload.date)) {
    throw new Error("date is required (YYYY-MM-DD)")
  }
  if (Number.isNaN(payload.amount) || payload.amount === 0) {
    throw new Error("amount is required")
  }
  if (!payload.categoryCode?.trim()) {
    throw new Error("categoryCode is required")
  }

  const now = new Date().toISOString()
  const record: TransactionRecord = {
    id: crypto.randomUUID(),
    date: payload.date.trim(),
    amount: Number(payload.amount),
    categoryCode: payload.categoryCode.trim().toUpperCase(),
    memo: payload.memo?.trim() || "",
    createdAt: now,
  }

  const data = await readData()
  data.transactions.push(record)
  await writeData(data)
  return record
}
