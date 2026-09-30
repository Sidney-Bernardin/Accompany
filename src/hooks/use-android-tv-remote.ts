import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import TcpSockets from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { loadCertificates } from "@/androidTvRemote/certificates"
import { Message_Status, MessageSchema } from "@/androidTvRemote/gen/proto/pair_pb"
import { decodeMsg, encodeMsg } from "@/androidTvRemote/serial"

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
  let buffer = useRef(Buffer.alloc(0))

  const disconnect = useCallback(() => {
    client.current?.destroy()
    client.current = undefined
    buffer.current = Buffer.alloc(0)
    setClientStatus("DISCONNECTED")
  }, [])

  const connect = useCallback(async () => {
    setClientStatus("CONNECTING")

    const { certPem, certPrivateKeyPem } = await loadCertificates()

    // Connect to the TV box.
    client.current = TcpSockets.connectTLS({
      host, port,
      ca: certPem,
      cert: certPem,
      key: certPrivateKeyPem,
    }, () => {
      setClientStatus("CONNECTED")
      callbacks.onConnect?.()

      client.current!.write(encodeMsg(MessageSchema, {
        $typeName: "example.Message",
        protocolVersion: 2,
        status: Message_Status.OK,
        pairingRequest: {
          $typeName: "example.PairingRequest",
          serviceName: "accompany-remote",
          clientName: "TestClientName",
        },
      }), undefined)
    })

    client.current.on("data", (packet) => {
      console.debug(`packet[${packet.length}]={${new Uint8Array(packet as unknown as Buffer)}}`)
      buffer.current = Buffer.concat([buffer.current, packet as Uint8Array])

      var [msg, len, offset] = decodeMsg(MessageSchema, buffer.current)
      if (!msg)
        return

      console.debug(msg)

      try {
        if (msg.status !== Message_Status.OK) {
          disconnect()
          return
        }
      } finally {
        buffer.current = buffer.current.subarray(offset + len)
      }
    })

    client.current.on("error", (err) => {
      console.error(err)
      disconnect()
    })

    client.current.on("close", () => {
      client.current = undefined
      setClientStatus("DISCONNECTED")
      callbacks.onClose?.()
    })
  }, [])

  useEffect(() => {
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
