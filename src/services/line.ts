import { validateSignature, LineBotClient, webhook } from "@line/bot-sdk"
import { getAccountBinding, createAccountBindingTableAndInsertValue } from "./accountBinding"
import { processAccountingMessage } from "./gemini"
import { Sheet } from "../models/sheet"

export const validateLineWebhook = async (bodyText: string, signature: string) => {
  const channelSecret = process.env.NEXT_LINE_CHANNEL_SECRET!
  return await validateSignature(bodyText, channelSecret, signature)
}

export const followEvent = async (event: webhook.FollowEvent) => {
  const userId = event?.source?.userId
  if (!userId) return "user id is required"

  let isTableExist = true
  let error

  try {
    const accountBinding = await getAccountBinding()
    if (accountBinding?.line_id === userId) {
      await replyMessage(event.replyToken, "You have already set your line ID.")
    }
    return "follow success"
  } catch (e) {
    error = e as Error
    if(error.message.includes("does not exist")) {
      console.log("--- account_binding table does not exist")
      isTableExist = false
    }
  }
  if (!isTableExist) {
    try {
      await createAccountBindingTableAndInsertValue(userId!)
      const sheet = new Sheet()
      const authUrl = sheet.getPersonalizedAuthUrl()
      const text = `You need to authorize Google sheet first, click the following link: ${authUrl}`
      await replyMessage(event.replyToken, text)

      return "follow success"
      // await replyMessage(event.replyToken, "Your line id has been set successfully")
      // return "follow success"
    } catch (e) {
      const err = e as Error
      console.error("followEvent error", err)
    }
  }

  console.log("--- follow failed, something went wrong ", error)
  return "follow failed, something went wrong"
}

export const messageEvent = async (event: webhook.MessageEvent) => {
  const replyToken = event.replyToken!
  let refreshToken, spreadsheetId
  try {
    const accountBinding = await getAccountBinding()
    refreshToken = accountBinding.google_sheet_refresh_token
    spreadsheetId = accountBinding.google_sheet_id
    if (!refreshToken || !spreadsheetId) {
      resetSheetToken(replyToken, true)
      return "Ready to set google sheet token"
    }
  } catch (error) {
    const err = error as Error
    console.error("messageEvent error", err)
    return "Something went wrong"
  }

  let message
  if (event.message.type === "text") {
    message = event.message.text
  }

  console.log("--- message", message)

  try {
     await processAccountingMessage(message!, refreshToken, spreadsheetId)
  } catch (error) {
    const err = error as Error;
    console.error("messageEvent error", err);
    const errMessage = (error as any).response?.data?.error_description
    if (errMessage === "Token has been expired or revoked.") {
      await resetSheetToken(replyToken)
      return "token expired"
    }
  }

  return "message success"
}

export const replyMessage = async (replyToken: string, text: string) => {
  const client = LineBotClient.fromChannelAccessToken({
    channelAccessToken: process.env.NEXT_LINE_CHANNEL_ACCESS_TOKEN!
  })
  await client.replyMessage({
    replyToken: replyToken,
    messages: [{
      type: "text",
      text: text
    }]
  })

  return "reply success"
}

const resetSheetToken = async (replyToken: string, isFIrstTime: boolean = false) => {
  const sheet = new Sheet()
  const authUrl = sheet.getPersonalizedAuthUrl()
  console.log("--- authUrl", authUrl)
  let prefix = isFIrstTime ? "You need to authorize Google sheet first, click the following link: " : "You need to re-authorize Google sheet, click the following link: "
  const text = `${prefix}：${authUrl}`

  await replyMessage(replyToken, text)
}

export const sendMessage = async (userId: string, text: string) => {
  const client = LineBotClient.fromChannelAccessToken({
    channelAccessToken: process.env.NEXT_LINE_CHANNEL_ACCESS_TOKEN!
  })

  await client.pushMessage({
    to: userId,
    messages: [{
      type: "text",
      text: text
    }]
  })
}