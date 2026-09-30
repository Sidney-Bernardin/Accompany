import { Buffer } from "@craftzdog/react-native-buffer"
import * as PB from "@bufbuild/protobuf"
import * as Varint from "@/varint"

export function encodeMsg<Desc extends PB.DescMessage>(schema: Desc, message: any): Uint8Array {
  const msgBytes = PB.toBinary(schema, message)
  const varint = Varint.encode(msgBytes.length)

  return Buffer.concat([varint, msgBytes])
}

// Return the decoded message, it's length, and it's length's byte-count.
export function decodeMsg<Desc extends PB.DescMessage>(schema: Desc, msgBytes: Buffer): [PB.MessageShape<Desc> | undefined, number, number] {
  const [len, offset] = Varint.decode(msgBytes)
  if (len === -1 || (msgBytes.length < offset + len))
    return [undefined, -1, -1]

  msgBytes = msgBytes.subarray(offset, offset + len)
  return [PB.fromBinary(schema, msgBytes), len, offset]
}
