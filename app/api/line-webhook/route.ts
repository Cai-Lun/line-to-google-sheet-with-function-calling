import {
  getAccountBinding,
  insertValueIntoAccountBinding
} from "@/src/services/accountBinding"

import { validateLineWebhook, followEvent, messageEvent } from "@/src/services/line"
import { webhook } from "@line/bot-sdk"

const requestMapping = {
  "follow": followEvent,
  "message": messageEvent
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-line-signature")!
  if (!signature) return new Response("Unauthorized", { status: 401 })

  const bodyText = await request.text()
  const isValid = validateLineWebhook(bodyText, signature)
  if (!isValid) return new Response("Unauthorized", { status: 401 })

  console.log("bodyText", bodyText)

  const body = JSON.parse(bodyText)
  const text = body.events[0].message.text.trim()
  if (!text) {
    return new Response("Bad Request", { status: 400 })
  }

  console.log("body", body)
  const events = body.events
  const eventType = events[0].type as webhook.Event["type"]
  const handler = requestMapping[eventType as keyof typeof requestMapping]

  let res
  if (handler) {
    const eventBody = events[0]
    res = await handler(eventBody)
  } else {
    return new Response("Bad Request", { status: 400 })
  }

  if (res && res.includes("success")) return new Response("OK", { status: 200 })

  return new Response("Internal Server Error", { status: 500 })
}
