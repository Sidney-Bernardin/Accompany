import TcpSockets from "react-native-tcp-socket"
import forge from "node-forge"
import crypto from "crypto"
import { Platform } from "react-native";

import * as SecureStore from "@/secureStore";


function validateCertificate(certificate: SecureStore.Certificate): boolean {
  try {
    const cert = forge.pki.certificateFromPem(certificate.certPem)

    // Check expiry.
    const deadline = cert.validity.notAfter.getTime() - (7 * 24 * 60 * 60 * 100) // Normal deadline with a 7 day buffer.
    const now = (new Date()).getTime()
    if (now > deadline) {
      return false
    }

  } catch (err) {
    // Failed to parse certificate.
    return false
  }

  return true
}

async function generateCertificate() {

  // Create public and private keys.
  const keys = forge.pki.rsa.generateKeyPair(2048, 65537)

  // Create certificate.
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = crypto.randomBytes(16).toString("hex")
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20)
  const certFields: forge.pki.CertificateField[] = [
    { name: "commonName", value: `Accompany-Remote-${Platform.OS}-${crypto.randomBytes(16).toString("hex")}` },
    { name: "organizationName", value: "AccompanyRemoteApp" },
    { name: "contryName", value: "US" },
  ]
  cert.setSubject(certFields)
  cert.setIssuer(certFields)
  cert.setExtensions([
    { name: "basicConstraints", cA: true },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true, keyCertSign: true },
    { name: "extKeyUsage", clientAuth: true, serverAuth: true }
  ])

  // Sign the certificate.
  cert.sign(keys.privateKey, forge.md.sha256.create())

  const certificate: SecureStore.Certificate = {
    certPem: forge.pki.certificateToPem(cert),
    certPrivateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
  }

  await SecureStore.setCertificate(certificate)

  return certificate
}

export async function createConnection(host: string, port: number): TcpSockets.Socket {

  let cert = await SecureStore.getCertificate()
  if (!cert || !validateCertificate(cert))
    cert = await generateCertificate()

  const client = TcpSockets.createConnection({
    host: "10.10.8.56",
    port: 6467,
  }, () => { })

  client.on("data", (d) => { })

  client.on("error", () => { })

  client.on("close", () => { })

  return client
}
