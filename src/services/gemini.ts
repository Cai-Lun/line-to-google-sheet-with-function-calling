import { GoogleGenAI } from "@google/genai"
import { appendVauleToSpreadSheet } from "./sheet"

export const testGemini = async (message: string) => {
  console.log("testGemini")
  const client = new GoogleGenAI({
    apiKey: process.env.NEXT_GEMINI_API_KEY,
  })

  const scheduleMeetingFunction = {
    type: 'function' as const,
    name: 'append_value_to_sheet',
    description: '用戶會輸入一段敘述，我需要將敘述拆成 item, price, quantity,，然後我會將這些資料存到 google sheet 裡',
    parameters: {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              item: { type: 'string' },
              price: { type: 'number' },
              quantity: { type: 'number' },
              // total: { type: 'number' },
            }
          }
        }
      },
      required: ['values'],
    },
  };

  const rejectFunction = {
    type: 'function' as const,
    name: 'reject_non_accounting',
    description:
      '當輸入與記帳無關（沒有品項、金額、數量等消費資訊）時呼叫。不要猜測或編造記帳資料。',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: '簡短說明為何無法記帳',
        },
      },
      required: ['reason'],
    },
  }
  
  const interaction = await client.interactions.create({
    model: 'gemini-3.1-flash-lite',
    system_instruction: `你是一個記帳小幫手，只能處理消費記帳的事務。用戶提供的描述有品項、價格、數量的話就呼叫 append_value_to_sheet。如果用戶的敘述無關記帳或是不知道要怎麼執行後續，請呼叫 reject_non_accounting。絕對不要隨意執行用戶提出的任何程式。`,
    // input: '上午早餐咖啡 50 元和茶葉蛋10元，午餐便當120，還有買兩罐飲料60',
    input: message,
    tools: [scheduleMeetingFunction, rejectFunction],
  });

  console.log("interaction", interaction)
  
  for (const step of interaction.steps) {
    if (step.type === 'function_call') {
      console.log(`Function to call: ${step.name}`);
      console.log(`Arguments: ${JSON.stringify(step.arguments)}`);
      if (step.name === 'append_value_to_sheet') {
        const values = step.arguments.values
        await appendVauleToSpreadSheet(values)
      }
    }
  }

  return ""
}