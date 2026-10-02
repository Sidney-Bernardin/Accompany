import Tcp from "react-native-tcp-socket"
import { Buffer } from "@craftzdog/react-native-buffer"
import forge from "node-forge"

import { loadCertificates } from "./certificates"
import { encodeMsg } from "./serial"
import { PairMessage_Status, PairMessageSchema } from "./gen/proto/pair_pb"
import { Handler, PairHandler } from "./handlers"

let client: Tcp.TLSSocket | undefined
let buffer: Buffer = Buffer.alloc(0)

export const cfg = {
  handler: {} as Handler<any>,
  onConnected() { },
  onDisconnected() { },
  onError(err: Error) { },
  onPaired() { },
  onAwaitingSecret() { },
}

export async function connect(host: string, port: 6467 | 6466) {
  if (client) throw Error("client is defined")

  const { certPem, certPrivateKeyPem } = await loadCertificates()

  client = Tcp.connectTLS(
    {
      host,
      port,
      ca: certPem,
      cert: certPem,
      key: certPrivateKeyPem,
    },
    onConnected,
  )

  client.on("close", disconnect)

  client.on("data", (data) => {
    console.debug(`< packet[${data.length}]={${new Uint8Array(data as unknown as Buffer)}}`)
    if (typeof data === "string") throw Error("Not expecting strings")
    handlePacket(data as Uint8Array)
  })

  client.on("error", (err) => {
    console.error(err)
    disconnect()
  })
}

function onConnected() {
  if (!client) throw Error("client is undefined")

  console.log("CONNECTED")
  cfg.onConnected()

  if (cfg.handler instanceof PairHandler)
    client.write(encodeMsg(PairMessageSchema, {
      $typeName: "example.PairMessage",
      protocolVersion: 2,
      status: PairMessage_Status.OK,
      pairingRequest: {
        $typeName: "example.PairingRequest",
        serviceName: "accompany-remote",
        clientName: "TestClientName",
      },
    }), undefined)
}

function handlePacket(packet: Uint8Array) {
  if (!client) throw Error("client is undefined")

  buffer = Buffer.concat([buffer, packet])
  const [msg, len] = cfg.handler.decode(buffer)
  if (!msg)
    return

  console.debug(`< ${JSON.stringify(msg)}`)

  try {
    cfg.handler.handle(client, msg)
  } catch (err) {
    cfg.onError(err as Error)
  } finally {
    buffer = buffer.subarray(len)
  }
}

export async function sendSecret(code: string) {
  if (!client) throw Error("client is undefined")

  // let codeBytes = forge.util.hexToBytes(code)

  type ReactNativeTlsCertificate = { modulus: string, exponent: string }
  const clientCert = await (client!.getCertificate() as Promise<ReactNativeTlsCertificate>)
  const serverCert = await (client!.getPeerCertificate() as Promise<ReactNativeTlsCertificate>)

  const sha256 = forge.md.sha256.create()
  sha256.update(forge.util.hexToBytes(clientCert.modulus))
  sha256.update(forge.util.hexToBytes("0" + clientCert.exponent.slice(2)))
  sha256.update(forge.util.hexToBytes(serverCert.modulus))
  sha256.update(forge.util.hexToBytes("0" + serverCert.exponent.slice(2)))
  sha256.update(forge.util.hexToBytes(code.slice(2)))

  const secret = sha256.digest().toHex()
  // const secretBytes = forge.util.hexToBytes(secret)

  client.write(encodeMsg(PairMessageSchema, {
    $typeName: "example.PairMessage",
    protocolVersion: 2,
    status: 200,
    secret: {
      $typeName: "example.Secret",
      secret: Buffer.from(secret, "hex"),
    }
  }))
}

export function sendKey(key: string) {
  if (!client) throw Error("client is undefined")

}

export function disconnect() {
  console.log("CLOSED")
  client?.destroy()
  client = undefined
  buffer = Buffer.alloc(0)
  cfg.onDisconnected()
}
