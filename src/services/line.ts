import { validateSignature, LineBotClient, webhook } from "@line/bot-sdk"
import { getAccountBinding, insertValueIntoAccountBinding } from "./accountBinding"
import { testGemini } from "./gemini"

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

  const response = await testGemini(message!)

  return "message success"



  // const client = LineBotClient.fromChannelAccessToken({
  //   channelAccessToken: process.env.NEXT_LINE_CHANNEL_ACCESS_TOKEN!
  // })
  // await client.messageEvent({
  //   userId: userId,
  //   text: text
  // })
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
}