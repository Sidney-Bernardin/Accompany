import { useCallback, useEffect, useState } from "react"
import { StyleProp, ViewStyle } from "react-native"
import * as SecureStore from "expo-secure-store";
import { BottomSheet } from "@expo/ui"
import { Host, OutlinedTextField, Column, Text, Button, Card, HorizontalMultiBrowseCarousel, TextField, useNativeState } from "@expo/ui/jetpack-compose"
import { wrapContentWidth, combinedClickable, fillMaxHeight, fillMaxWidth } from "@expo/ui/jetpack-compose/modifiers"

import { openApp } from "@/tv"


type App = {
  name: string,
  link: string
}

const defualtApps = [
  { name: "YouTube", link: "https://youtube.com/watch/Aq5WXmQQooo" },
  { name: "Disney+", link: "https://www.disneyplus.com" },
  { name: "Netflix", link: "https://www.netflix.com/watch/70202141" },
  { name: "Prime", link: "https://watch.amazon.com/B08WJQ3XP5" },
  { name: "Empty", link: "https://foobarbaz.com" },
  { name: "Empty", link: "https://foobarbaz.com" },
  { name: "Empty", link: "https://foobarbaz.com" },
  { name: "Empty", link: "https://foobarbaz.com" },
  { name: "Empty", link: "https://foobarbaz.com" },
  { name: "Empty", link: "https://foobarbaz.com" },
] as const

export default function Apps(props: { style: StyleProp<ViewStyle> }) {
  const [apps, setApps] = useState<App[]>(() => JSON.parse(SecureStore.getItem("apps") || JSON.stringify(defualtApps)))
  const [selectedApp, setSelectedApp] = useState<number>(-1)

  const name = useNativeState("")
  const link = useNativeState("")

  const save = useCallback(async () => {
    setApps(apps.with(selectedApp, {
      name: name.value,
      link: link.value,
    }))

    setSelectedApp(-1)
  }, [selectedApp, apps])

  useEffect(() => {
    SecureStore.setItem("apps", JSON.stringify(apps))
  }, [apps])

  return (
    <Host matchContents={{}} style={{ ...props.style }}>
      <BottomSheet isPresented={selectedApp !== -1} onDismiss={() => { setSelectedApp(-1) }}>
        <Column verticalArrangement={{ spacedBy: 10 }}>
          <Text modifiers={[fillMaxWidth(), wrapContentWidth()]}>
            {selectedApp + 1}
          </Text>

          <OutlinedTextField value={name} modifiers={[fillMaxWidth()]} keyboardOptions={{ imeAction: "done" }}>
            <TextField.Label>
              <Text>Name</Text>
            </TextField.Label>
            <TextField.Placeholder>
              <Text>Whatever you want!</Text>
            </TextField.Placeholder>
          </OutlinedTextField>

          <OutlinedTextField value={link} modifiers={[fillMaxWidth()]} keyboardOptions={{ imeAction: "done" }}>
            <TextField.Label>
              <Text>Link</Text>
            </TextField.Label>
            <TextField.Placeholder>
              <Text>https://foobarbaz.com</Text>
            </TextField.Placeholder>
          </OutlinedTextField>

          <Button onClick={save} modifiers={[fillMaxWidth()]}>
            <Text>Save</Text>
          </Button>
        </Column>
      </BottomSheet>

      <HorizontalMultiBrowseCarousel preferredItemWidth={150} itemSpacing={10} contentPadding={{ bottom: 10 }} flingBehavior="noSnap">
        {apps.map((m, idx) => (
          <Card
            key={idx}
            modifiers={[
              combinedClickable({
                onClick: () => openApp(apps[idx].link),
                onLongClick: () => {
                  setSelectedApp(idx)
                  name.value = apps[idx].name
                  link.value = apps[idx].link
                },
              }),
            ]}
          >
            <Column modifiers={[fillMaxWidth(), fillMaxHeight()]} horizontalAlignment="center" verticalArrangement="center">
              <Text>{m.name}</Text>
            </Column>
          </Card>
        ))}
      </HorizontalMultiBrowseCarousel>
    </Host >
  )
}
