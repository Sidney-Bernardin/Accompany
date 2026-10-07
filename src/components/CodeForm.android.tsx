import { useCallback } from "react"
import { Host, Text, TextField } from "@expo/ui/jetpack-compose"

import { sendSecret } from "@/tv"


export default function CodeForm() {
  const onDone = useCallback((code: string) => sendSecret(code), [])

  return (
    <Host matchContents={{ vertical: true }}>
      <TextField autoFocus keyboardOptions={{ imeAction: "done" }} keyboardActions={{ onDone: onDone }}>
        <TextField.Label>
          <Text>Code</Text>
        </TextField.Label>
        <TextField.Placeholder>
          <Text>abc123</Text>
        </TextField.Placeholder>
      </TextField>
    </Host >
  )
}
