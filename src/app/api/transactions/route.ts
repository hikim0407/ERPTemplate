import { NextResponse } from "next/server"
import { createTransaction, listTransactions } from "@/lib/transaction-repo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const limitParam = Number(searchParams.get("limit") || "50")
  const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(200, limitParam)) : 50

  try {
    const transactions = await listTransactions(limit)
    return NextResponse.json({ transactions })
  } catch (error) {
    console.error("GET /api/transactions error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const created = await createTransaction(payload)
    return NextResponse.json({ transaction: created })
  } catch (error: any) {
    const message = error?.message || "Internal Server Error"
    const status = message.includes("required") || message.includes("YYYY") ? 400 : 500
    console.error("POST /api/transactions error", error)
    return NextResponse.json({ error: message }, { status })
  }
}
