import { NextResponse } from "next/server"
import {
  listByDepth,
  listChildren,
  getWithChildren,
  upsertCodes,
  deleteWithDescendants,
  type CodeNode,
} from "@/lib/code-tree-repo"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const depthParam = searchParams.get("depth")
  const parentParam = searchParams.get("parent")
  const codeParam = searchParams.get("code")

  try {
    if (codeParam) {
      const result = await getWithChildren(codeParam)
      if (!result.node) {
        return NextResponse.json({ error: "Code not found" }, { status: 404 })
      }
      return NextResponse.json(result)
    }

    if (parentParam !== null && searchParams.has("parent")) {
      const children = await listChildren(parentParam || null)
      return NextResponse.json({ codes: children })
    }

    const depth = depthParam ? Number(depthParam) : 1
    const codes = await listByDepth(depth)
    return NextResponse.json({ codes })
  } catch (error) {
    console.error("GET /api/code-tree error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const payload = await request.json()
    const codes = (payload.codes as CodeNode[]) || []
    if (!Array.isArray(codes) || !codes.length) {
      return NextResponse.json({ error: "codes array is required" }, { status: 400 })
    }
    const result = await upsertCodes(codes)
    return NextResponse.json(result)
  } catch (error: any) {
    const message = error?.message || "Internal Server Error"
    const status = message.includes("Duplicate") || message.includes("Parent") ? 400 : 500
    console.error("PUT /api/code-tree error", error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const codeParam = searchParams.get("code")

  if (!codeParam) {
    return NextResponse.json({ error: "code is required" }, { status: 400 })
  }

  try {
    const result = await deleteWithDescendants(codeParam)
    if (!result.deleted) {
      return NextResponse.json({ error: "Code not found" }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (error) {
    console.error("DELETE /api/code-tree error", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
