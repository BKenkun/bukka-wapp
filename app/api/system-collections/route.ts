import { NextResponse } from "next/server"
import { getEnabledSystemCollections } from "@/lib/system-collections"

// GET - List enabled system collections (public)
export async function GET() {
  try {
    const collections = await getEnabledSystemCollections()
    return NextResponse.json(collections)
  } catch (error) {
    console.error("Error fetching system collections:", error)
    return NextResponse.json(
      { error: "Error fetching collections" },
      { status: 500 }
    )
  }
}
