import { useCallback, useEffect, useRef, useState } from "react"

import callbacks from "./callbacks"
import { PairMessage_Status } from "./gen/proto/pair_pb"
import { RemoteKeyCode, RemoteDirection } from "./gen/proto/remote_pb"
import { TvError } from "./errors"
import { connect, disconnect, sendKey, sendSecret, openApp } from "./client"


export { callbacks, PairMessage_Status, RemoteKeyCode, RemoteDirection, sendKey, sendSecret, openApp }

type TvStatus =
  "DISCONNECTED" |
  "CONNECTING" |
  "AWAITING_SECRET" |
  "CONFIGURED"

export function useTv(host: string) {
  const [tvError, setTvError] = useState<TvError | undefined>(undefined)
  const [tvStatus, setTvStatus] = useState<TvStatus>("DISCONNECTED")
  const tvStatusRef = useRef<TvStatus>("DISCONNECTED")

  useEffect(() => { tvStatusRef.current = tvStatus }, [tvStatus])
  useEffect(() => {
    callbacks.onConnecting = () => setTvStatus("CONNECTING")
    callbacks.onDisconnected = () => setTvStatus("DISCONNECTED")
    callbacks.onTvError = (err) => setTvError(err)
    callbacks.onAwaitingSecret = () => setTvStatus("AWAITING_SECRET")
    callbacks.onConfigured = () => setTvStatus("CONFIGURED")
    callbacks.onPaired = () => connect(host, 6466)

    connect(host, 6466).then(() => {
      setTimeout(() => {
        console.debug(`TIMEOUT during ${tvStatusRef.current}`)
        if (tvStatusRef.current === "CONNECTING")
          connect(host, 6467)
      }, 1000)
    })

    return () => {
      disconnect()
    }
  }, [])

  return { tvStatus, tvError }
}
