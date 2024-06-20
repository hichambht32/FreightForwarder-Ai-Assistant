// import { Database } from "@/supabase/types"
// import { ChatSettings } from "@/types"
// import { createClient } from "@supabase/supabase-js"
// import { OpenAIStream, StreamingTextResponse } from "ai"
// import { ServerRuntime } from "next"
// import OpenAI from "openai"
// import { ChatCompletionCreateParamsBase } from "openai/resources/chat/completions.mjs"

// export const runtime: ServerRuntime = "edge"

// export async function POST(request: Request) {
//   const json = await request.json()
//   const { chatSettings, messages, customModelId } = json as {
//     chatSettings: ChatSettings
//     messages: any[]
//     customModelId: string
//   }

//   try {
//     const supabaseAdmin = createClient<Database>(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.SUPABASE_SERVICE_ROLE_KEY!
//     )

//     const { data: customModel, error } = await supabaseAdmin
//       .from("models")
//       .select("*")
//       .eq("id", customModelId)
//       .single()

//     if (!customModel) {
//       throw new Error(error.message)
//     }

//     const custom = new OpenAI({
//       apiKey: customModel.api_key || "",
//       baseURL: customModel.base_url
//     })

//     const response = await custom.chat.completions.create({
//       model: chatSettings.model as ChatCompletionCreateParamsBase["model"],
//       messages: messages as ChatCompletionCreateParamsBase["messages"],
//       temperature: chatSettings.temperature,
//       stream: true
//     })

//     const stream = OpenAIStream(response)

//     return new StreamingTextResponse(stream)
//   } catch (error: any) {
//     let errorMessage = error.message || "An unexpected error occurred"
//     const errorCode = error.status || 500

//     if (errorMessage.toLowerCase().includes("api key not found")) {
//       errorMessage =
//         "Custom API Key not found. Please set it in your profile settings."
//     } else if (errorMessage.toLowerCase().includes("incorrect api key")) {
//       errorMessage =
//         "Custom API Key is incorrect. Please fix it in your profile settings."
//     }

//     return new Response(JSON.stringify({ message: errorMessage }), {
//       status: errorCode
//     })
//   }
// }

import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { user_input } = req.body

    try {
      const response = await fetch("http://127.0.0.1:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_input })
      })

      const data = await response.json()
      return res.status(200).json(data)
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error fetching data from Flask API" })
    }
  } else {
    res.setHeader("Allow", ["POST"])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}
