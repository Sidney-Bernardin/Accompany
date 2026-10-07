import { Buffer } from "@craftzdog/react-native-buffer"
import * as PB from "@bufbuild/protobuf"
import * as Varint from "@/varint"

export function encode<Desc extends PB.DescMessage>(schema: Desc, protoMsg: PB.MessageShape<Desc>): Uint8Array {
  console.debug(`> ${JSON.stringify(protoMsg)}`)

  const msg = PB.toBinary(schema, protoMsg)
  const varint = Varint.encode(msg.length)

  return Buffer.concat([varint, msg])
}

// Return the decoded message, it's length, and it's length's byte-count.
export function decode<Desc extends PB.DescMessage>(schema: Desc, msg: Buffer): [PB.MessageShape<Desc> | undefined, number] {
  const [len, offset] = Varint.decode(msg)
  if (len === -1 || (msg.length < offset + len))
    return [undefined, -1]

  msg = msg.subarray(offset, offset + len)
  return [PB.fromBinary(schema, msg), offset + len]
}
