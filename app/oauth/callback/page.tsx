"use client"
import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  setRefreshToken,
} from "./action"
import { Spinner } from "@heroui/react"

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState({
    status: 500,
    message: "Something went wrong, please try again.",
  })
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  useEffect(() => {
    if (code) handleSetRefreshToken()
  }, [code]) 

  const handleSetRefreshToken = async () => {
    if (code) {
      setLoading(true)
      const message = await setRefreshToken(code)
      setLoading(false)
      setResponse({
        status: message.status,
        message: message.message,
      })
    }
  }

  const messageResponse = () => {
    return (
      <>
        {response.status === 200 ? (
          <div>Refresh token set successfully</div>
        ): (
          <div>{response.message}</div>
        )}
      </>
    )
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col py-32 px-16 bg-white dark:bg-black sm:items-start">
        {loading ? (
          <div className="flex items-center justify-center gap-x-2">
            <Spinner color="accent" />
            <h5 >Setting refresh token...</h5>
          </div>
        ): 
         (messageResponse())
        }
      </main>
    </div>
  );
}
