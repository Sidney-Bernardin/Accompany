import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import * as Tv from "@/tv"
import { RemoteHandler } from "@/tv/handlers"
import { PairHandler } from "@/tv/handlers"

export function useTv(host: string) {
  const [status, setStatus] = useState<"DISCONNECTED" | "CONNECTING" | "PAIRING" | "PAIRED">("DISCONNECTED")
  const [error, setError] = useState<string | undefined>(undefined)

  const appState = useRef(AppState.currentState)

  const sendSecret = useCallback((code: string) => Tv.sendSecret(code), [])
  const sendKey = useCallback((key: string) => Tv.sendKey(key), [])

  useEffect(() => {
    Tv.cfg.onConnected = () => setStatus("PAIRING")
    Tv.cfg.onDisconnected = () => setStatus("DISCONNECTED")
    Tv.cfg.onError = (err) => setError(err.message)
    Tv.cfg.onAwaitingSecret = () => setStatus("PAIRING")
    Tv.cfg.onPaired = () => {
      console.log("PAIRED")
      Tv.disconnect()
      Tv.cfg.handler = new RemoteHandler()
      Tv.cfg.onConnected = () => setStatus("PAIRED")
      Tv.connect(host, 6466)
    }
    Tv.cfg.handler = new PairHandler({ onAwaitingSecret: Tv.cfg.onAwaitingSecret, onPaired: Tv.cfg.onPaired })

    Tv.connect(host, 6467)

    // Connect and disconnect when the app state changes.
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match("/inactive|background/") && nextAppState == "active")
        Tv.connect(host, 6467)
      if (nextAppState.match("/inactive|background/"))
        Tv.disconnect()
    })

    return () => {
      Tv.disconnect()
      sub.remove()
    }
  }, [])

  return { status, error, sendSecret }
}
