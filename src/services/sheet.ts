import { getAccountBinding } from "./accountBinding"
import { google } from "googleapis"
import { Sheet } from "../models/sheet"

export const createSpreadSheet = async (refreshToken: string) => {
  // console.log("--- createSpreadSheet start")
  try {
    // const accountBinding = await getAccountBinding()
    // const refreshToken = accountBinding?.google_sheet_refresh_token
    // const spreadsheetId = accountBinding?.google_sheet_id
    // if (spreadsheetId) throw new Error("Spreadsheet already created")

    // if (!refreshToken) {
    //   throw new Error("Refresh token is required")
    // }
    const sheet = new Sheet(refreshToken)

    const res = await sheet.sheetSerivce.spreadsheets.create({
      requestBody: {
        properties: {
          title: process.env.NEXT_PUBLIC_SPREADSHEET_NAME ?? "我的記賬 Sheet"
        }
      }
    })

    return res.data.spreadsheetId
  } catch (error) {
    throw error
  }
}

export const setSheetHeader = async (spreadsheetId: string, refreshToken: string) => {
  try {
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required")
    }
    const headerValues = [["Item", "Price", "Quantity", "Total", "Date"]]
    appendVauleToSpreadSheet(headerValues, refreshToken, spreadsheetId)
  } catch (error) {
    const err = error as Error;
    console.error("setSheetHeader error", err);
    throw error;
  }
}

export const appendVauleToSpreadSheet = async (values: string[][], refreshToken: string, spreadsheetId: string) => {
  try {
    // if (!refreshToken || !spreadsheetId) {
    //   throw new Error("Refresh token or spreadsheet ID is required")
    // }
    const sheet = new Sheet(refreshToken)
    const res = await sheet.sheetSerivce.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: "A1:B1",
      valueInputOption: "RAW",
      requestBody: {
        values
      }
    })

    // console.log("--- appendVauleToSpreadSheet res", res)
    // console.log("--- appendVauleToSpreadSheet success")

  } catch (error) {
    const err = error as Error;
    console.error("appendVauleToSpreadSheet error", err);
    throw error;
  }
}

// export const createSpreadSheetAndSetHeader = async () => {
//   try {
//     const spreadsheetId = await createSpreadSheet()
//     if (!spreadsheetId) throw new Error("Create spreadsheet failed")
//     await setSheetHeader(spreadsheetId)
//   } catch (error) {
//     throw error
//   }
// }