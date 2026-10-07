import { Host, Text, HorizontalUncontainedCarousel, Box, Button, Shape, HorizontalPager, HorizontalMultiBrowseCarousel } from "@expo/ui/jetpack-compose"
import { border, clip, fillMaxHeight, fillMaxWidth, graphicsLayer, height, Shapes } from "@expo/ui/jetpack-compose/modifiers"
import { StyleProp, ViewStyle } from "react-native"


const macros = [
  {
    name: "YouTub",
    link: "https://youtube.com"
  },
  {
    name: "Disney+",
    link: "https://www.disneyplus.com/browse/entity-e88d028f-d88c-4fda-85ad-adf51a87fabc?sharesource=Android"
  },
  {
    name: "YouTube",
    link: "https://youtube.com"
  },
  {
    name: "Disney+",
    link: "https://www.disneyplus.com/browse/entity-e88d028f-d88c-4fda-85ad-adf51a87fabc?sharesource=Android"
  },
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
    <Host matchContents={{}} style={{ ...props.style }}>
      <HorizontalMultiBrowseCarousel preferredItemWidth={150} itemSpacing={10} contentPadding={{ bottom: 10 }} flingBehavior="noSnap">
        {macros.map((m, idx) => (
          <Button key={idx} modifiers={[fillMaxWidth(), fillMaxHeight()]} shape={Shape.Rectangle({})}>
            <Text>{m.name}</Text>
          </Button>
        ))}
      </HorizontalMultiBrowseCarousel>
    </Host >
  )
}
