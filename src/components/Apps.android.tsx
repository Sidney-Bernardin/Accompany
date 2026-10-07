import { Host, HorizontalUncontainedCarousel, Box, Text } from "@expo/ui/jetpack-compose"
import { background, fillMaxWidth, height } from "@expo/ui/jetpack-compose/modifiers"
import { StyleProp, ViewStyle } from "react-native"


const macros = [
  {
    name: "YouTube",
    link: "https://youtube.com"
  },
  {
    name: "Disney+",
    link: "https://www.disneyplus.com/browse/entity-e88d028f-d88c-4fda-85ad-adf51a87fabc?sharesource=Android"
  },
]

export default function Apps(props: { style: StyleProp<ViewStyle> }) {
  return (
    <Host matchContents={{ vertical: true }} style={{ ...props.style }}>
      <HorizontalUncontainedCarousel itemWidth={150} itemSpacing={10}>
        {macros.map((m) => (
          <Box key={m.name} modifiers={[background("green"), fillMaxWidth(), height(150)]}>
            <Text>{m.name}</Text>
          </Box>
        ))}
      </HorizontalUncontainedCarousel>
    </Host >
  )
}
