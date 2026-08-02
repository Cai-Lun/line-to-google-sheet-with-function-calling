import { appendVauleToSpreadSheet } from "@/src/services/sheet"

export async function POST(request: Request) {
  const body = await request.json()
  console.log("--- body", JSON.stringify(body, null, 2))
  try {
    const values = body.values
    await appendVauleToSpreadSheet(values)
    return new Response("success")
  } catch (error) {
    const err = error as Error;
    console.error("appendVauleToSpreadSheet error", err);
    throw error;
  }
}

