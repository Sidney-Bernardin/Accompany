import forge from "node-forge"
import { Platform } from "react-native";

import * as SecureStore from "@/secureStore";


export async function loadCertificates(): Promise<SecureStore.Certificate> {
  console.log("b1")
  const certificate = await SecureStore.getCertificate()

  // Validate the certificate.
  try {
    if (!certificate)
      throw Error()

    // Check PEM formatting. (throws on fail)
    console.log("b2")
    const cert = forge.pki.certificateFromPem(certificate.certPem)

    // Check expiry.
    console.log("b3")
    const deadline = cert.validity.notAfter.getTime() - (7 * 24 * 60 * 60 * 100) // Normal deadline with a 7 day buffer.
    const now = (new Date()).getTime()
    if (now > deadline) {
      throw Error()
    }
  } catch (err) {
    console.log("b4")
    return generateCertificate()
  }

  return certificate
}

async function generateCertificate() {

  // Create public and private keys.
  console.log("b5")
  const keys = forge.pki.rsa.generateKeyPair(2048, 65537)

  // Create certificate.
  console.log("b6")
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16))
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20)
  console.log("b7")
  const certFields: forge.pki.CertificateField[] = [
    { shortName: "CN", value: `Accompany-Remote-${Platform.OS}-${forge.util.bytesToHex(forge.random.getBytesSync(16))}` },
    { shortName: "O", value: "AccompanyRemoteApp" },
    { shortName: "C", value: "US" },
  ]
  cert.setSubject(certFields)
  cert.setIssuer(certFields)
  cert.setExtensions([
    { name: "basicConstraints", cA: true },
    { name: "keyUsage", digitalSignature: true, keyEncipherment: true, keyCertSign: true },
    { name: "extKeyUsage", clientAuth: true, serverAuth: true }
  ])

  // Sign the certificate.
  console.log("b8")
  cert.sign(keys.privateKey, forge.md.sha256.create())

  console.log("b9")
  const certificate: SecureStore.Certificate = {
    certPem: forge.pki.certificateToPem(cert),
    certPrivateKeyPem: forge.pki.privateKeyToPem(keys.privateKey),
  }

  console.log("b10")
  await SecureStore.setCertificate(certificate)

  return certificate
}
