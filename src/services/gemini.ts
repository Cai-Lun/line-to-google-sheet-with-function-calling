import { GoogleGenAI } from "@google/genai"
import { appendVauleToSpreadSheet } from "./sheet"

export const processAccountingMessage = async (message: string, refreshToken: string, spreadsheetId: string) => {
  console.log("--- processAccountingMessage")
  const client = new GoogleGenAI({
    apiKey: process.env.NEXT_GEMINI_API_KEY,
  })

  const scheduleMeetingFunction = {
    type: 'function' as const,
    name: 'append_value_to_sheet',
    description: `用戶會輸入一段敘述，請幫我將敘述內提到對應的資料組成陣列，陣列的資料格式為 [[品項, 單價, 數量, 小計, 日期]]，今天日期為: ${new Date().toISOString().split('T')[0]}`,
    parameters: {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          description: '多筆資料列，例如 [["咖啡", 50, 1, 50, "2026-07-27"]]',
          items: {
            type: 'array',
            description: '[item, price, quantity, total, date]',
            items: {
              anyOf: [{ type: 'string' }, { type: 'number' }],
            },
            minItems: 5,
            maxItems: 5,
          },
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
    input: message,
    tools: [scheduleMeetingFunction, rejectFunction],
  });

  console.log("--- interaction", interaction)
  
  try {
    for (const step of interaction.steps) {
      if (step.type === 'function_call') {
        console.log(`Function to call: ${step.name}`);
        console.log(`Arguments: ${JSON.stringify(step.arguments)}`);
        if (step.name === 'append_value_to_sheet') {
          const values = step.arguments.values
          await appendVauleToSpreadSheet(values, refreshToken, spreadsheetId)

          return step.arguments
        }
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error("processAccountingMessage error", err);
    throw error;
  }
}