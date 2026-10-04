import Tcp from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { PairMessage_Status, PairMessageSchema, Options_Encoding_EncodingType, Options_RoleType, PairMessage } from "@/tv/gen/proto/pair_pb"
import { decodeMsg, encodeMsg } from "./serial"
import { RemoteMessage, RemoteMessageSchema } from "./gen/proto/remote_pb"
import { TvError } from "./error"


export const cfg = {
  onPaired: () => { },
  onAwaitingSecret: () => { },
  onConfigured: () => { },
}

export interface Handler<T> {
  decode(msg: Buffer): [T | undefined, number]
  handle(client: Tcp.Socket, msg: T): void
}

export const PairHandler: Handler<PairMessage> = {
  decode: (msg) => decodeMsg(PairMessageSchema, msg),

  handle(client, msg) {
    if (msg.status !== PairMessage_Status.OK)
      throw new TvError(msg.status)

    else if (msg.pairingRequestAck)
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
      cfg.onAwaitingSecret()

    else if (msg.secretAck) {
      console.log("PAIRED")
      cfg.onPaired()
    }
  }
}

export const RemoteHandler: Handler<RemoteMessage> = {
  decode: (msg) => decodeMsg(RemoteMessageSchema, msg),

  handle(client, msg) {
    if (msg.remotePingRequest)
      client.write(encodeMsg(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remotePingResponse: {
          $typeName: "example.RemotePingResponse",
          val1: msg.remotePingRequest.val1,
        }
      }))

    else if (msg.remoteConfigure)
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

    else if (msg.remoteSetActive) {
      console.log("CONFIGURED")
      cfg.onConfigured()

      client?.write(encodeMsg(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remoteSetActive: {
          $typeName: "example.RemoteSetActive",
          active: 622,
        }
      }))
    }
  }
}
