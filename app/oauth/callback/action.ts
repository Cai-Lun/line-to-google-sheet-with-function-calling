"use server"

import { Sheet } from "@/src/models/sheet"
import { getAccountBinding, updateAccountBindingValueByLineId } from "@/src/services/accountBinding"
import { createSpreadSheet, setSheetHeader } from "@/src/services/sheet"
import { sendMessage } from "@/src/services/line"

const setRefreshToken = async (code: string, lineId: string) => {
  try {
    const sheet = new Sheet()
    const tokens = await sheet.getToken(code)
    const refreshToken = tokens?.refresh_token
    if (!refreshToken) return { status: 400, message: "Set refresh token failed"}

    // const accountBinding = await getAccountBinding()
    // const lineId = accountBinding?.line_id
    // if (!lineId) return { status: 400, message: "Line ID is required" }

    await updateAccountBindingValueByLineId("google_sheet_refresh_token", refreshToken, lineId)
    return { status: 200, message: "Set refresh token success, you can close this page now.", refreshToken }
  } catch (error) {
    const err = error as Error
    console.error("setRefreshToken error", err)
    return { status: 500, message: "Set refresh token failed" }
  }
}

export const setRefreshTokenAndSpreadsheet = async (code: string) => {
  // console.log("--- setRefreshTokenAndSpreadsheet code")
  try {
    const accountBinding = await getAccountBinding()
    const lineId = accountBinding?.line_id
    if (!lineId) return { status: 400, message: "Line ID is required" }

    const setRefreshTokenRes = await setRefreshToken(code, lineId)
    if (accountBinding.google_sheet_id || !setRefreshTokenRes.refreshToken) return setRefreshTokenRes
    
    const spreadsheetId = await createSpreadSheet(setRefreshTokenRes.refreshToken)
    if (!spreadsheetId) return { status: 400, message: "Create spreadsheet failed" }
    
    const res = await updateAccountBindingValueByLineId("google_sheet_id", spreadsheetId, lineId)
    if (!res) return { status: 400, message: "Update account binding value failed" }

    await setSheetHeader(spreadsheetId, setRefreshTokenRes.refreshToken)
    await sendMessage(lineId, "You have successfully authorized Google sheet")

    return { status: 200, message: "You have successfully authorized Google sheet, you can close this page now." }
  } catch (error) {
    const err = error as Error
    console.error("setRefreshTokenAndSpreadsheet error", err)
    return { status: 500, message: "Set refresh token and spreadsheet failed" }
  }
}
