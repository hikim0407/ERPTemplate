import { NextResponse } from "next/server"
import {
  deleteUser,
  getUser,
  listUsers,
  upsertUser,
  getUserByEmail,
} from "@/lib/user-repo"

const scrub = (user: any) => {
  if (!user) return user
  // Remove password before sending to client
  const { password: _pw, ...rest } = user
  return rest
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const idParam = searchParams.get("id")
  const emailParam = searchParams.get("email")

  try {
    if (idParam) {
      const user = await getUser(idParam)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      return NextResponse.json({ user: scrub(user) })
    }

    if (emailParam) {
      const user = await getUserByEmail(emailParam)
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
      return NextResponse.json({ user: scrub(user) })
    }

    const users = await listUsers()
    return NextResponse.json({ users: users.map(scrub) })
  } catch (error) {
    console.error("GET /api/users error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json()
    const saved = await upsertUser(payload)
    return NextResponse.json({ user: scrub(saved) })
  } catch (error: any) {
    const message = error?.message || "Internal Server Error"
    const status = message.includes("required") || message.includes("exists") ? 400 : 500
    console.error("PUT /api/users error", error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const idParam = searchParams.get("id")

  if (!idParam) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }

  try {
    const result = await deleteUser(idParam)
    if (!result.deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("DELETE /api/users error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
