import { useCallback } from "react"
import { ImageSourcePropType, Pressable, StyleProp, ViewStyle } from "react-native"
import { Host, Icon, FilledTonalIconButton } from "@expo/ui/jetpack-compose"
import { fillMaxHeight, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers"

import { RemoteDirection, RemoteKeyCode, sendKey } from "@/tv"


export default function RemoteButton(props: {
  style: StyleProp<ViewStyle>,
  k: RemoteKeyCode,
  icon: ImageSourcePropType
}) {
  const send = useCallback((dir: RemoteDirection) => sendKey(props.k, dir), [])

  return (
    <Pressable
      style={{ ...props.style }}
      onPressIn={() => send(RemoteDirection.START_LONG)}
      onPressOut={() => send(RemoteDirection.END_LONG)}
    >
      <Host style={{ height: "100%" }}>
        <FilledTonalIconButton modifiers={[fillMaxWidth(), fillMaxHeight()]}>
          <Icon source={props.icon} />
        </FilledTonalIconButton>
      </Host>
    </Pressable>
  )
}
