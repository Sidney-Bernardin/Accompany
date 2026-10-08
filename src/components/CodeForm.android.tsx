import { useCallback } from "react"
import { Host, Text, OutlinedTextField, TextField } from "@expo/ui/jetpack-compose"

import { sendSecret } from "@/tv"


export default function CodeForm() {
  const onDone = useCallback((code: string) => sendSecret(code), [])

  return (
    <Host matchContents={{ vertical: true }}>
      <OutlinedTextField autoFocus keyboardOptions={{ imeAction: "done" }} keyboardActions={{ onDone: onDone }}>
        <TextField.Label>
          <Text>Code</Text>
        </TextField.Label>
        <TextField.Placeholder>
          <Text>It should be on you TV right now!</Text>
        </TextField.Placeholder>
      </OutlinedTextField>
    </Host >
  )
}
