"use server"

import { Sheet } from "@/src/models/sheet"
import { getAccountBinding, updateAccountBindingValueByLineId } from "@/src/services/accountBinding"
import { createSpreadSheet, setSheetHeader } from "@/src/services/sheet"
import { redirect } from "next/navigation"

export const testGetAccountBinding = async () => {
  const res = await getAccountBinding()
  return res
}

export const testGetSheetAuthUrl = async () => {
  const sheet = new Sheet()
  const authUrl = sheet.getPersonalizedAuthUrl()
  return authUrl
}

export const testSetRefreshToken = async (code: string) => {
  try {
    const accountBinding = await testGetAccountBinding()
    const lineId = accountBinding?.line_id
    // let refreshToken = accountBinding?.google_sheet_refresh_token
    if (!lineId) return "Line ID is required"
    // if (!update && refreshToken) return "Refresh token already set"
    
    const sheet = new Sheet()
    const tokens = await sheet.getToken(code)
    const refreshToken = tokens?.refresh_token

    if (!refreshToken) return "Get refresh token failed"

    const res = await updateAccountBindingValueByLineId("google_sheet_refresh_token", refreshToken, lineId)
    return "Set refresh token success"
  } catch (error) {
    const err = error as Error
    console.error("testGetSheetToken error", err)
    throw error
  }
}

export const testCreateSpreadSheetAndSetHeader = async () => {
  try {
    const spreadsheetId = await createSpreadSheet()
    if (!spreadsheetId) return "Create spreadsheet failed"

    const accountBinding = await getAccountBinding()
    const lineId = accountBinding?.line_id
    const res = await updateAccountBindingValueByLineId("google_sheet_id", spreadsheetId, lineId)
    await setSheetHeader(spreadsheetId)

    return res
  } catch (error) {
    const err = error as Error
    console.error("testCreateSpreadSheet error", JSON.stringify(err, null, 2))
    if (err.message === "Spreadsheet already created") return "Spreadsheet already created"

    const errDescription = (error as any).response?.data?.error_description
    if (errDescription === "Token has been expired or revoked.") {
      const sheet = new Sheet()
      const authUrl = sheet.getPersonalizedAuthUrl()
      redirect(authUrl)
    }

    return err.message
  }
}
