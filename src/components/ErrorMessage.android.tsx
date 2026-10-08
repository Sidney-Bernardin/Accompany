import { Host, Text } from "@expo/ui/jetpack-compose"


export default function ErrorMessage(props: { error: string }) {
  return (
    <Host matchContents>
      <Text>{props.error}</Text>
    </Host>
  )
}
