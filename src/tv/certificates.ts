import forge from "node-forge"
import { Platform } from "react-native";

import * as SecureStore from "expo-secure-store";

export async function loadCertificates(): Promise<{ certPem: string, certPrivateKeyPem: string }> {
  const [certPem, certPrivateKeyPem] = await Promise.all([
    SecureStore.getItemAsync("accompany_cert"),
    SecureStore.getItemAsync("accompany_cert_private_key"),
  ])

  // Validate the certificate.
  try {
    if (!certPem || !certPrivateKeyPem)
      throw Error()

    // Check PEM formatting. (throws on fail)
    const cert = forge.pki.certificateFromPem(certPem)

    // Check expiry.
    const deadline = cert.validity.notAfter.getTime() - (7 * 24 * 60 * 60 * 100) // Normal deadline with a 7 day buffer.
    const now = (new Date()).getTime()
    if (now > deadline) {
      throw Error()
    }
  } catch (err) {
    return generateCertificate()
  }

  return { certPem, certPrivateKeyPem }
}

async function generateCertificate() {

  // Create public and private keys.
  const keys = forge.pki.rsa.generateKeyPair(2048, 65537)

  // Create certificate.
  const cert = forge.pki.createCertificate()
  cert.publicKey = keys.publicKey
  cert.serialNumber = forge.util.bytesToHex(forge.random.getBytesSync(16))
  cert.validity.notBefore = new Date()
  cert.validity.notAfter = new Date()
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 20)
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
  cert.sign(keys.privateKey, forge.md.sha256.create())

  // Convert to PEM format.
  const certPem = forge.pki.certificateToPem(cert)
  const certPrivateKeyPem = forge.pki.privateKeyToPem(keys.privateKey)

  await Promise.all([
    SecureStore.setItemAsync("accompany_cert", forge.pki.certificateToPem(cert)),
    SecureStore.setItemAsync("accompany_cert_private_key", forge.pki.privateKeyToPem(keys.privateKey)),
  ])

  return { certPem, certPrivateKeyPem }
}
