import { useCallback, useEffect, useRef, useState } from "react"

import * as Tv from "@/tv"
import * as TvHandlers from "@/tv/handlers"
import { RemoteKeyCode } from "@/tv/gen/proto/remote_pb"
import { TvError } from "@/tv/error"


type TvStatus =
  "DISCONNECTED" |
  "CONNECTING" |
  "AWAITING_SECRET" |
  "CONFIGURED"

export function useTv(host: string) {
  const [tvError, setTvError] = useState<TvError | undefined>(undefined)
  const [tvStatus, setTvStatus] = useState<TvStatus>("DISCONNECTED")
  const tvStatusRef = useRef<TvStatus>("DISCONNECTED")

  const sendSecret = useCallback((code: string) => Tv.sendSecret(code), [])
  const sendKey = useCallback((key: RemoteKeyCode) => Tv.sendKey(key), [])
  const openApp = useCallback((link: string) => Tv.openApp(link), [])

  useEffect(() => { tvStatusRef.current = tvStatus }, [tvStatus])
  useEffect(() => {
    Tv.cfg.onConnecting = () => setTvStatus("CONNECTING")
    Tv.cfg.onDisconnected = () => setTvStatus("DISCONNECTED")
    Tv.cfg.onTvError = (err) => setTvError(err)
    TvHandlers.cfg.onAwaitingSecret = () => setTvStatus("AWAITING_SECRET")
    TvHandlers.cfg.onConfigured = () => setTvStatus("CONFIGURED")
    TvHandlers.cfg.onPaired = () => Tv.connect(host, 6466)

    Tv.connect(host, 6466).then(() => {
      setTimeout(() => {
        console.debug(`TIMEOUT during ${tvStatusRef.current}`)
        if (tvStatusRef.current === "CONNECTING")
          Tv.connect(host, 6467)
      }, 1000)
    })

    return () => {
      Tv.disconnect()
    }
  }, [])

  return { tvStatus, tvError, sendSecret, sendKey, openApp }
}
