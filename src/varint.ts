import { Buffer } from "@craftzdog/react-native-buffer"

export function encode(num: number): Buffer {
  const varint: number[] = []

  // If len is more then 7 bits long, it's to big to be represented as one varint-byte.
  while (num > 0b01111111) {

    // Get the first 7 bits to the right, then remove them.
    const first7bits = num & 0b01111111
    num = num >>> 7

    // Add a continuation bit.
    const varintByte = first7bits | 0b10000000

    varint.push(varintByte)
  }

  varint.push(num)

  return Buffer.from(varint)
}

export function decode(varint: Buffer): [number, number] {
  let val = 0
  let byteCount = 0

  let shift = 0
  for (let i = 0; i < varint.length; i++) {
    const byte = varint[i]

    // Get the first 7 bits to the right, then shift them into place.
    const first7bits = byte & 0b01111111
    first7bits << shift
    shift += 7

    val += first7bits
    byteCount += 1

    // Get the continuation bit, then if it's 0, the decoding is complete.
    const continuationBit = byte & 0b10000000
    if (continuationBit === 0) {
      return [val, byteCount]
    }
  }

  return [-1, -1]
}
