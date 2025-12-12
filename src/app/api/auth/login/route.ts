import { NextResponse } from "next/server"
import { getUserByEmail } from "@/lib/user-repo"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    const user = await getUserByEmail(email || "")

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const { password: _, ...userWithoutPassword } = user

    const response = NextResponse.json({
      message: "Login successful",
      user: userWithoutPassword,
    })

    response.cookies.set("auth-token", "mock-jwt-token", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
