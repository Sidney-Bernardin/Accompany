import { useCallback } from "react"
import { View, StyleProp, ViewStyle } from "react-native"
import { GestureDetector, useExclusiveGestures, useLongPressGesture, usePanGesture } from "react-native-gesture-handler"
import { useSharedValue } from "react-native-reanimated"

import { RemoteDirection, RemoteKeyCode, sendKey } from "@/tv"

export default function TouchPad(props: { style: StyleProp<ViewStyle> }) {
  const longPress = useLongPressGesture({
    runOnJS: true,
    onTouchesDown: () => sendKey(RemoteKeyCode.KEYCODE_DPAD_CENTER, RemoteDirection.START_LONG),
    onTouchesUp: () => sendKey(RemoteKeyCode.KEYCODE_DPAD_CENTER, RemoteDirection.END_LONG),
  })

  const vecterToDir = useCallback((x: number, y: number): RemoteKeyCode | undefined => {
    if (Math.abs(x) > Math.abs(y))
      if (x < 0) return RemoteKeyCode.KEYCODE_DPAD_LEFT
      else return RemoteKeyCode.KEYCODE_DPAD_RIGHT
    if (Math.abs(x) < Math.abs(y))
      if (y < 0) return RemoteKeyCode.KEYCODE_DPAD_UP
      else return RemoteKeyCode.KEYCODE_DPAD_DOWN
    else
      return RemoteKeyCode.KEYCODE_UNKNOWN
  }, [])

  const dir = useSharedValue(0)
  const hold = useSharedValue(false)
  const pan = usePanGesture({
    runOnJS: true,
    onUpdate: (e) => {
      if (hold.value) return
      const d = vecterToDir(e.translationX, e.translationY)
      if (!d) return
      hold.value = true
      dir.value = d
      sendKey(d, RemoteDirection.START_LONG)
    },
    onDeactivate: () => {
      hold.value = false
      sendKey(dir.value, RemoteDirection.END_LONG)
    },
  })

  const gestures = useExclusiveGestures(pan, longPress)

  return (
    <GestureDetector gesture={gestures}>
      <View style={{ ...props.style }} />
    </GestureDetector >
  )
}
