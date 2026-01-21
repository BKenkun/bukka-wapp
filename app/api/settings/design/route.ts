import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Default button settings
const defaultButtonSettings = {
  primary: {
    backgroundColor: "#FA4860",
    textColor: "#FFFFFF",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    hoverBackgroundColor: "#E03E54",
    hoverTextColor: "#FFFFFF",
  },
  secondary: {
    backgroundColor: "transparent",
    textColor: "#FA4860",
    borderRadius: "0",
    fontSize: "16",
    fontWeight: "500",
    padding: "10px 28px",
    borderColor: "#FA4860",
    borderWidth: "2",
    hoverBackgroundColor: "#FA4860",
    hoverTextColor: "#FFFFFF",
  },
}

export async function GET() {
  try {
    const settings = await prisma.siteSettings.findUnique({
      where: { key: "design_buttons" },
    })

    return NextResponse.json({
      buttons: settings?.value || defaultButtonSettings,
    })
  } catch (error) {
    console.error("Error loading design settings:", error)
    return NextResponse.json({
      buttons: defaultButtonSettings,
    })
  }
}
