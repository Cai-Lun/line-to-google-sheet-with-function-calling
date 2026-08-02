"use server"

import { Sheet } from "@/src/models/sheet"
import { getAccountBinding, updateAccountBindingValueByLineId } from "@/src/services/accountBinding"

export const setRefreshToken = async (code: string) => {
  try {
    const sheet = new Sheet()
    const tokens = await sheet.getToken(code)
    const refreshToken = tokens?.refresh_token
    if (!refreshToken) return { status: 400, message: "Set refresh token failed"}

    const accountBinding = await getAccountBinding()
    const lineId = accountBinding?.line_id
    if (!lineId) return { status: 400, message: "Line ID is required" }

    await updateAccountBindingValueByLineId("google_sheet_refresh_token", refreshToken, lineId)
    return { status: 200, message: "Set refresh token success, you can close this page now." }
  } catch (error) {
    const err = error as Error
    console.error("setRefreshToken error", err)
    return { status: 500, message: "Set refresh token failed" }
  }
}
