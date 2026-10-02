import * as SecureStore from "expo-secure-store";

const keys = [
  "accompany_cert",
  "accompany_cert_private_key",
] as const
type key = typeof keys[number]

export async function setCertificate(cert: string, certPrivateKeyPem: string) {
  await Promise.all([
    SecureStore.setItemAsync("accompany_cert" as key, cert.certPem),
    SecureStore.setItemAsync("accompany_cert_private_key" as key, cert.certPrivateKeyPem),
  ])
}

export async function getCertificate(): Promise<Certificate | undefined> {
  const [certPem, certPrivateKeyPem] = await Promise.all([
    SecureStore.getItemAsync("accompany_cert" as key),
    SecureStore.getItemAsync("accompany_cert_private_key" as key),
  ])

  return (certPem && certPrivateKeyPem)
    ? { certPem, certPrivateKeyPem }
    : undefined
}
