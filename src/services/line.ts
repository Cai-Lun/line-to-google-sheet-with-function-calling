import { validateSignature, LineBotClient, webhook } from "@line/bot-sdk"
import { getAccountBinding, insertValueIntoAccountBinding } from "./accountBinding"
import { processAccountingMessage } from "./gemini"
import { Sheet } from "../models/sheet"

export const validateLineWebhook = async (bodyText: string, signature: string) => {
  const channelSecret = process.env.NEXT_LINE_CHANNEL_SECRET!
  return validateSignature(bodyText, channelSecret, signature)
}

export const followEvent = async (event: webhook.FollowEvent) => {
  const userId = event?.source?.userId
  // if (!userId) return

  const accountBinding = await getAccountBinding();
  if (accountBinding.ength === 0) {
    await insertValueIntoAccountBinding("line_id", userId!);
    await replyMessage(event.replyToken, "line id set successfully")
    return "follow success"
  }
}

export const messageEvent = async (event: webhook.MessageEvent) => {
  let message
  if (event.message.type === "text") {
    message = event.message.text
  }

  console.log("message", message)

  try {
     await processAccountingMessage(message!)
  } catch (error) {
    const err = error as Error;
    console.error("messageEvent error", err);
    const errMessage = (error as any).response?.data?.error_description
    if (errMessage === "Token has been expired or revoked.") {
      await resetSheetToken(event.replyToken!)
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

const resetSheetToken = async (replyToken: string) => {
  const sheet = new Sheet()
  const authUrl = sheet.getPersonalizedAuthUrl()
  console.log("authUrl", authUrl)
  const text = `請重新授權 Google Sheet，點擊以下連結：${authUrl}`

  replyMessage(replyToken, text)
}
