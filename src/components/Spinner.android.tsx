import { Host, LoadingIndicator } from "@expo/ui/jetpack-compose"
import { StyleProp, ViewStyle } from "react-native"


export default function Spinner(props: { style: StyleProp<ViewStyle> }) {
  return (
    <Host matchContents>
      <LoadingIndicator />
    </Host>
  )
}
