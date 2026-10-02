import * as PB from "@bufbuild/protobuf"
import { Buffer } from "@craftzdog/react-native-buffer"

import { PairMessage_Status, PairMessageSchema, Options_Encoding_EncodingType, Options_RoleType, PairMessage } from "@/androidTvRemote/gen/proto/pair_pb"
import { encodeMsg } from "./serial"
import { RemoteMessage, RemoteMessageSchema } from "./gen/proto/remote_pb"

let pairMsg: PairMessage | undefined
let remoteMsg: RemoteMessage | undefined

export function deocdePair() {
  pairMsg = PB.fromBinary(PairMessageSchema, buffer)
}

export function deocdeRemote(b: Buffer) {
  return PB.fromBinary(RemoteMessageSchema, b)
}

// Return the decoded message, it's length, and it's length's byte-count.
function decodeMsg<Desc extends PB.DescMessage>(schema: Desc): [PB.MessageShape<Desc> | undefined, number, number] {
  const [len, offset] = Varint.decode(msgBytes)
  if (len === -1 || (msgBytes.length < offset + len))
    return [undefined, -1, -1]

  msgBytes = msgBytes.subarray(offset, offset + len)
  return [PB.fromBinary(schema, msgBytes), len, offset]
}

