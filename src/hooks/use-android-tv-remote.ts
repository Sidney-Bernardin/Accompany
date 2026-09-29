import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import TcpSockets from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { loadCertificates } from "@/androidTvRemote/certificates"
import * as PB from "@bufbuild/protobuf"
import { Message_Status, MessageSchema } from "@/androidTvRemote/gen/proto/pair_pb"

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

  const disconnect = () => {
    client.current?.destroy()
    client.current = undefined
    setClientStatus("DISCONNECTED")
  }

  const connect = useCallback(async () => {
    setClientStatus("CONNECTING")

    const cert = await loadCertificates()

    // Connect to the TV box.
    client.current = TcpSockets.connectTLS({
      host,
      port,
      ca: cert.certPem,
      cert: cert.certPem,
      key: cert.certPrivateKeyPem,
    }, () => {
      setClientStatus("CONNECTED")
      callbacks.onConnect?.()

      const message = PB.toBinary(MessageSchema, {
        $typeName: "example.Message",
        protocolVersion: 2,
        status: Message_Status.OK,
        pairingRequest: {
          $typeName: "example.PairingRequest",
          serviceName: "accompany-remote",
          clientName: "TestClientName",
        },
      })

      let len = message.length
      const varint: number[] = []

      // If len is more then 7 bits long, it's to big to be represented as one varint-byte.
      while (len > 0b01111111) {

        // Get the first 7 bits to the right, then remove them.
        const first7bits = len & 0b01111111
        len = len >>> 7

        // Add a continuation bit.
        const varintByte = first7bits | 0b10000000

        varint.push(varintByte)
      }
      varint.push(len)

      client.current?.write(Buffer.concat([Buffer.from(varint), message]), undefined)
    })

    let buffer = Buffer.alloc(0)
    client.current.on("data", (packet) => {
      console.log(`packet len=${packet.length} {${new Uint8Array(packet as unknown as Buffer)}}`)
      buffer = Buffer.concat([buffer, packet as Uint8Array])

      let len = 0
      let lenOffset = 0
      let lenComplete = false

      let shift = 0
      for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i]

        // Get the first 7 bits to the right, then shift them into place.
        const first7bits = byte & 0b01111111
        first7bits << shift
        shift += 7

        len += first7bits
        lenOffset += 1

        // Get the continuation bit, then if it's 0, the decoding is complete.
        const continuationBit = byte & 0b10000000
        if (continuationBit === 0) {
          lenComplete = true
          break
        }
      }

      if (!lenComplete) return
      if (buffer.length < lenOffset + len) return

      const msgBytes = buffer.subarray(lenOffset, lenOffset + len)
      const msg = PB.fromBinary(MessageSchema, msgBytes)
      console.log(msg)

      if (msg.status !== Message_Status.OK) {
        disconnect()
        return
      }

      buffer = buffer.subarray(lenOffset + len)
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
