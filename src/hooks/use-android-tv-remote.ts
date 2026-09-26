import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import TcpSockets from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { loadCertificates } from "@/androidTvRemote/certificates"
import * as PB from "@bufbuild/protobuf"
import { Message_Status, Message_StatusSchema, MessageSchema } from "@/androidTvRemote/gen/proto/pair_pb"

type Callbacks = Partial<{
  onConnect: () => void,
  onError: (err: Error) => void,
  onClose: () => void,
  onSecret: (secret: string) => void,
}>

export function useAndroidTvRemote(host: string, port: number, callbacks: Callbacks) {
  const [clientStatus, setClientStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED">("DISCONNECTED")

  const appState = useRef(AppState.currentState)
  const client = useRef<TcpSockets.Socket | undefined>(undefined)

  const connect = useCallback(async () => {
    setClientStatus("CONNECTING")

    console.log("B")
    const cert = await loadCertificates()

    // Connect to the TV box.
    console.log("C")
    client.current = TcpSockets.connectTLS({
      host,
      port,
      ca: cert.certPem,
      cert: cert.certPem,
      key: cert.certPrivateKeyPem,
    }, () => {
      setClientStatus("CONNECTED")
      callbacks.onConnect?.()

      // PB.toBinary(MessageSchema, {
      //   protocolVersion: 2,
      //   status: Message_Status.OK,
      //   pairingRequest: { serviceName: }
      // })
    })

    const buffer = Buffer.alloc(0)
    client.current.on("data", (packet) => {
      console.log(`packet: ${packet}`)
    })

    client.current.on("error", (err) => {
      console.error(err)
      callbacks.onError?.(err)
    })

    client.current.on("close", () => {
      client.current = undefined
      setClientStatus("DISCONNECTED")
      callbacks.onClose?.()
    })
  }, [])

  const disconnect = () => {
    client.current?.destroy()
    client.current = undefined
    setClientStatus("DISCONNECTED")
  }

  useEffect(() => {
    console.log("A")
    connect()

    // Connect and disconnect when the app state changes.
    const sub = AppState.addEventListener("change", (nextAppState) => {
      if (appState.current.match("/inactive|background/") && nextAppState == "active")
        connect()
      if (nextAppState.match("/inactive|background/"))
        disconnect()
    })

    return () => {
      disconnect()
      sub.remove()
    }
  }, [])

  return { clientStatus, appState, client }
}
