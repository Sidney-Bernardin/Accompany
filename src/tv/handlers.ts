import Tcp from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { PairMessage_Status, PairMessageSchema, Options_Encoding_EncodingType, Options_RoleType, PairMessage } from "@/tv/gen/proto/pair_pb"
import { decodeMsg, encodeMsg } from "./serial"
import { RemoteMessage, RemoteMessageSchema } from "./gen/proto/remote_pb"

export interface Handler<T> {
  decode(msg: Buffer): [T | undefined, number]
  handle(client: Tcp.Socket, msg: T): void
}

export class PairHandler implements Handler<PairMessage> {
  onPaired: () => void
  onAwaitingSecret: () => void

  constructor(opts: { onPaired: () => void, onAwaitingSecret: () => void }) {
    this.onPaired = opts.onPaired
    this.onAwaitingSecret = opts.onAwaitingSecret
  }

  decode(msg: Buffer): [PairMessage | undefined, number] {
    return decodeMsg(PairMessageSchema, msg)
  }

  handle(client: Tcp.Socket, msg: PairMessage) {
    if (msg.status !== PairMessage_Status.OK) {
      if (msg.status === PairMessage_Status.BAD_SECRET)
        throw Error("BAD CODE")

      throw Error("ERROR")
    }

    if (msg.pairingRequestAck)
      client.write(encodeMsg(PairMessageSchema, {
        $typeName: "example.PairMessage",
        protocolVersion: 2,
        status: PairMessage_Status.OK,
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

    else if (msg.options)
      client.write(encodeMsg(PairMessageSchema, {
        $typeName: "example.PairMessage",
        protocolVersion: 2,
        status: PairMessage_Status.OK,
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

    else if (msg.configurationAck)
      this.onAwaitingSecret()

    else if (msg.secretAck)
      this.onPaired()
  }
}

export class RemoteHandler implements Handler<RemoteMessage> {
  decode(msg: Buffer): [RemoteMessage | undefined, number] {
    return decodeMsg(RemoteMessageSchema, msg)
  }

  handle(client: Tcp.Socket, msg: RemoteMessage) {
    if (msg.remotePingRequest)
      client.write(encodeMsg(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remotePingResponse: {
          $typeName: "example.RemotePingResponse",
          val1: msg.remotePingRequest.val1,
        }
      }))

    if (msg.remoteConfigure)
      client.write(encodeMsg(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remoteConfigure: {
          $typeName: "example.RemoteConfigure",
          code1: 622,
          deviceInfo: {
            $typeName: "example.RemoteDeviceInfo",
            model: "mymodel",
            vendor: "myvender",
            unknown1: 1,
            unknown2: "2",
            packageName: "mypackagename",
            appVersion: "1.0.0",
          }
        }
      }))
  }
}
