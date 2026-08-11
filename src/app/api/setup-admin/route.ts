import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await auth.api.signUpEmail({
      body: {
        email: "admin@admin.com",
        password: "admin123",
        name: "Admin"
      }
    });
    return NextResponse.json({ success: true, data: res });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || error }, { status: 500 });
  }
}
