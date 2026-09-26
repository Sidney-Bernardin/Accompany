import { createConnection } from "@/androidTvRemote"
import { useEffect, useRef, useState } from "react"
import { AppState } from "react-native"

async function useAndroidTvRemote() {
  const [status, setStatus] = useState<"DISCONNECTED" | "CONNECTED">("")

  const appState = useRef(AppState.currentState)
  const clientRef = useRef({
    appState: AppState.currentState,
    client: null,
    buffer: Buffer.alloc(0),
  })

  useEffect(() => {
    clientRef.current = createConnection("10.10.8.56", 6467)
  }, [])
}
