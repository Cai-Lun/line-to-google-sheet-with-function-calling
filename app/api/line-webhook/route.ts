import { validateLineWebhook, followEvent, messageEvent } from "@/src/services/line"
import { webhook } from "@line/bot-sdk"

const requestMapping = {
  "follow": followEvent,
  "message": messageEvent
}

export async function POST(request: Request) {
  console.log("--- request", request)
  const signature = request.headers.get("x-line-signature")!
  if (!signature) return new Response("Unauthorized", { status: 401 })

  const bodyText = await request.text()
  const body = JSON.parse(bodyText)
  const isValid = await validateLineWebhook(bodyText, signature)
  // console.log("--- isValid", isValid)
  if (!isValid) return new Response("Unauthorized", { status: 401 })

  // console.log("--- bodyText", bodyText)
  // console.log("--- body", body)

  const events = body.events
  const eventType = events[0].type as webhook.Event["type"]
  const handler = requestMapping[eventType as keyof typeof requestMapping]
  // console.log("--- eventType", eventType)

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
