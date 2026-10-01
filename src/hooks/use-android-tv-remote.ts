import { AppState } from "react-native"
import { useCallback, useEffect, useRef, useState } from "react"

import TcpSockets from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { loadCertificates } from "@/androidTvRemote/certificates"
import { Message_Status, MessageSchema, Options_Encoding_EncodingType, Options_RoleType } from "@/androidTvRemote/gen/proto/pair_pb"
import { decodeMsg, encodeMsg } from "@/androidTvRemote/serial"

type Callbacks = Partial<{
  onConnect: () => void,
  onError: (err: Error) => void,
  onClose: () => void,
  onSecret: (secret: string) => void,
}>

export function useAndroidTvRemote(host: string, port: number, callbacks: Callbacks) {
  const [status, setStatus] = useState<"DISCONNECTED" | "CONNECTING" | "CONNECTED" | "SECRETING">("DISCONNECTED")

  const appState = useRef(AppState.currentState)
  const client = useRef<TcpSockets.Socket | undefined>(undefined)
  let buffer = useRef(Buffer.alloc(0))

  const disconnect = useCallback(() => {
    client.current?.destroy()
    client.current = undefined
    buffer.current = Buffer.alloc(0)
    setStatus("DISCONNECTED")
  }, [])

  const connect = useCallback(async () => {
    setStatus("CONNECTING")

    const { certPem, certPrivateKeyPem } = await loadCertificates()

    // Connect to the TV box.
    client.current = TcpSockets.connectTLS({
      host, port,
      ca: certPem,
      cert: certPem,
      key: certPrivateKeyPem,
    }, () => {
      setStatus("CONNECTED")
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

        if (msg.pairingRequestAck)
          client.current!.write(encodeMsg(MessageSchema, {
            $typeName: "example.Message",
            protocolVersion: 2,
            status: Message_Status.OK,
            options: {
              $typeName: "example.Options",
              preferredRole: Options_RoleType.INPUT,
              outputEncodings: [],
              inputEncodings: [
                {
                  $typeName: "example.Options.Encoding",
                  type: Options_Encoding_EncodingType.HEXADECIMAL,
                  symbolLength: 6,
                },
              ],
            }
          }))

        if (msg.options)
          client.current!.write(encodeMsg(MessageSchema, {
            $typeName: "example.Message",
            protocolVersion: 2,
            status: Message_Status.OK,
            configuration: {
              $typeName: "example.Configuration",
              clientRole: Options_RoleType.INPUT,
              encoding: {
                $typeName: "example.Options.Encoding",
                type: Options_Encoding_EncodingType.HEXADECIMAL,
                symbolLength: 6,
              },
            }
          }))

        if (msg.configurationAck)
          setStatus("SECRETING")
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
      setStatus("DISCONNECTED")
      callbacks.onClose?.()
    })
  }, [])

  const sendSecret = useCallback((inp: any) => {
    console.log(inp)
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

  return { status, appState, client, sendSecret }
}
