import * as PB from "@bufbuild/protobuf"
import { Buffer } from "@craftzdog/react-native-buffer"

import { PairMessage_Status, PairMessageSchema, Options_Encoding_EncodingType, Options_RoleType, PairMessage } from "@/androidTvRemote/gen/proto/pair_pb"
import { encodeMsg } from "./serial"
import { RemoteMessage, RemoteMessageSchema } from "./gen/proto/remote_pb"
import { AndroidTvRemote } from "."

export class PairHandler implements Handler {
  client: AndroidTvRemote
  msg: PairMessage | undefined

  constructor(client: AndroidTvRemote) {
    this.client = client
  }

  handle() {
    if (this.msg!.status !== PairMessage_Status.OK) {
      throw Error(`$Bad status ${this.msg!.status}`)
    }

    if (this.msg!.pairingRequestAck)
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

    else if (this.msg!.options)
      client.current!.write(encodeMsg(PairMessageSchema, {
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

    else if (this.msg!.configurationAck)
      setStatus("AWAITING_SECRET")

    else if (this.msg!.secretAck) {
      disconnect()
      handler.current = handleRemoteData
      port = 6466
      connect()
    }
  },
}

export const remoteHandler: Handler & { msg?: RemoteMessage } = {
  decode() {
    this.msg = PB.fromBinary(RemoteMessageSchema, buffer)
  },

  handle() {
    if (this.msg!.remotePingRequest)
      client.write(encodeMsg(RemoteMessageSchema, {
        $typeName: "example.RemoteMessage",
        remotePingResponse: {
          $typeName: "example.RemotePingResponse",
          val1: this.msg!.remotePingRequest.val1,
        }
      }))
  }
}
}
