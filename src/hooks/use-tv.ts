import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import * as Tv from "@/tv"
import { RemoteHandler } from "@/tv/handlers"
import { PairHandler } from "@/tv/handlers"
import { RemoteKeyCode } from "@/tv/gen/proto/remote_pb"

export function useTv(host: string) {
  const [status, setStatus] = useState<"DISCONNECTED" | "PAIRING" | "AWAITING_SECRET" | "READY">("DISCONNECTED")
  const [error, setError] = useState<string | undefined>(undefined)

  const appState = useRef(AppState.currentState)

  const sendSecret = useCallback((code: string) => Tv.sendSecret(code), [])
  const sendKey = useCallback((key: RemoteKeyCode) => Tv.sendKey(key), [])
  const openApp = useCallback((link: string) => Tv.openApp(link), [])

  useEffect(() => {
    Tv.cfg.onPairing = () => setStatus("PAIRING")
    Tv.cfg.onDisconnected = () => setStatus("DISCONNECTED")
    Tv.cfg.onReady = () => setStatus("READY")
    Tv.cfg.onError = (err) => setError(err.message)
    Tv.cfg.handler = new RemoteHandler() // TODO: dynamic handler
    // Tv.cfg.handler = new PairHandler({
    //   onAwaitingSecret: () => setStatus("PAIRING"),
    //   onPaired: () => {
    //     Tv.disconnect()
    //     Tv.cfg.handler = new RemoteHandler()
    //     Tv.connect(host, 6466)
    //   },
    // })

    Tv.connect(host, 6466) // TODO: dynamic port

    // Connect and disconnect when the app state changes.
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match("/inactive|background/") && nextAppState == "active")
        Tv.connect(host, 6466) // TODO: dynamic port
      if (nextAppState.match("/inactive|background/"))
        Tv.disconnect()
    })

    return () => {
      Tv.disconnect()
      sub.remove()
    }
  }, [])

  return { status, error, sendSecret, sendKey, openApp }
}
