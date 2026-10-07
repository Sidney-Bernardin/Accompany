import { Host, Text } from "@expo/ui/jetpack-compose"


export default function ErrorMessage(props: { error: string }) {
  return (
    <Host matchContents>
      <Text color="red">{props.error}</Text>
    </Host>
  )
}
