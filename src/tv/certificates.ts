import forge from "node-forge"
import { Platform } from "react-native";
import QuickCrypto, { CryptoKey } from "react-native-quick-crypto"

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
  console.log("CERTIFICATE generateing...")

  // Create public and private keys.
  const keys = await new Promise<[string, string]>((resolve, reject) =>
    QuickCrypto.generateKeyPair("rsa",
      {
        modulusLength: 2048,
        publicExponent: 65537,
        publicKeyEncoding: { type: "pkcs1", format: "pem" },
        privateKeyEncoding: { type: "pkcs1", format: "pem" },
      },
      (err, publicKey, privateKey) =>
        err ? reject(err) : resolve([
          publicKey as string,
          privateKey as string,
        ])))

  const publicKey = forge.pki.publicKeyFromPem(keys[0] as string)
  const privateKey = forge.pki.privateKeyFromPem(keys[1] as string)

  // Create certificate.
  const cert = forge.pki.createCertificate()
  cert.publicKey = publicKey
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
  cert.sign(privateKey, forge.md.sha256.create())

  // Convert to PEM format.
  const certPem = forge.pki.certificateToPem(cert)
  const certPrivateKeyPem = forge.pki.privateKeyToPem(privateKey)

  await Promise.all([
    SecureStore.setItemAsync("accompany_cert", forge.pki.certificateToPem(cert)),
    SecureStore.setItemAsync("accompany_cert_private_key", forge.pki.privateKeyToPem(privateKey)),
  ])

  console.log("CERTIFICATE generated!")

  return { certPem, certPrivateKeyPem }
}
