import Tcp from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"

import { PairMessage_Status, PairMessageSchema, Options_Encoding_EncodingType, Options_RoleType, PairMessage } from "@/tv/gen/proto/pair_pb"
import { RemoteMessage, RemoteMessageSchema } from "./gen/proto/remote_pb"
import { decode, encode } from "./serial"
import { TvError } from "./errors"
import callbacks from "./callbacks"


export interface Handler<T> {
  decode(msg: Buffer): [T | undefined, number]
  handle(client: Tcp.Socket, msg: T): void
}

export const PairHandler: Handler<PairMessage> = {
  decode: (msg) => decode(PairMessageSchema, msg),

  handle(client, msg) {
    if (msg.status !== PairMessage_Status.OK)
      throw new TvError(msg.status)

    else if (msg.pairingRequestAck)
      client.write(encode(PairMessageSchema, {
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
      client.write(encode(PairMessageSchema, {
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
      callbacks.onAwaitingSecret()

    else if (msg.secretAck) {
      console.log("PAIRED")
      callbacks.onPaired()
    }
  }
}

export const RemoteHandler: Handler<RemoteMessage> = {
  decode: (msg) => decode(RemoteMessageSchema, msg),

  handle(client, msg) {
    if (msg.remotePingRequest)
      client.write(encode(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remotePingResponse: {
          $typeName: "example.RemotePingResponse",
          val1: msg.remotePingRequest.val1,
        }
      }))

    else if (msg.remoteConfigure)
      client.write(encode(RemoteMessageSchema, {
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
      client.write(encode(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remoteSetActive: {
          $typeName: "example.RemoteSetActive",
          active: 622,
        }
      }))

      console.log("CONFIGURED")
      callbacks.onConfigured()
    }

    else if (msg.remoteImeBatchEdit)
      callbacks.onTexting()
  }
}
