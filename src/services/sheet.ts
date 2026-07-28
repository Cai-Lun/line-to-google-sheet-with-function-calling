import { getAccountBinding } from "./accountBinding"
import { google } from "googleapis"
import { Sheet } from "../models/sheet"

export const createSpreadSheet = async () => {
  console.log("createSpreadSheet start")
  try {
    const accountBinding = await getAccountBinding()
    const refreshToken = accountBinding?.google_sheet_refresh_token
    const spreadsheetId = accountBinding?.google_sheet_id
    if (spreadsheetId) throw new Error("Spreadsheet already created")

    if (!refreshToken) {
      throw new Error("Refresh token is required")
    }
    const sheet = new Sheet(refreshToken)

    const res = await sheet.sheetSerivce.spreadsheets.create({
      requestBody: {
        properties: {
          title: "My first spreadsheet"
        }
      }
    })

    return res.data.spreadsheetId
  } catch (error) {
    throw error
  }
}

export const setSheetHeader = async (spreadsheetId: string) => {
  try {
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required")
    }
    const headerValues = [["Item", "Price", "Quantity", "Total", "Date"]]
    appendVauleToSpreadSheet(headerValues)
  } catch (error) {
    const err = error as Error;
    console.error("setSheetHeader error", err);
    throw error;
  }
}

export const appendVauleToSpreadSheet = async (values: string[][]) => {
  try {
    const accountBinding = await getAccountBinding()
    const refreshToken = accountBinding?.google_sheet_refresh_token
    const spreadsheetId = accountBinding?.google_sheet_id
    if (!refreshToken) {
      throw new Error("Refresh token is required")
    }
    if (!spreadsheetId) {
      throw new Error("Spreadsheet ID is required")
    }
    const sheet = new Sheet(refreshToken)
    const res = await sheet.sheetSerivce.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: "A1:B1",
      valueInputOption: "RAW",
      requestBody: {
        values
      }
    })

    console.log("appendVauleToSpreadSheet res", res)

  } catch (error) {
    const err = error as Error;
    console.error("appendVauleToSpreadSheet error", err);
    throw error;
  }
}
