import { useRouter } from 'expo-router';
import { Host, Text, LazyColumn, ListItem, PullToRefreshBox } from "@expo/ui/jetpack-compose"
import { clickable } from "@expo/ui/jetpack-compose/modifiers"
import { Service } from "react-native-zeroconf";


export default function ServiceList(props: {
  services: Service[],
  refreshing: boolean,
  onRefresh: () => void,
}) {
  const nav = useRouter()

  return (
    <Host style={{ height: "100%" }}>
      <PullToRefreshBox
        isRefreshing={props.refreshing}
        onRefresh={props.onRefresh}
        contentAlignment='topCenter'
      >
        <LazyColumn verticalArrangement={{ spacedBy: 5 }}>
          {props.services.map((svc) => (
            <ListItem key={svc.ipv4[0]} modifiers={[clickable(() => nav.navigate(`/remote/${svc.ipv4[0]}`))]}>
              <ListItem.HeadlineContent>
                <Text>{svc.name}</Text>
              </ListItem.HeadlineContent>
              <ListItem.SupportingContent>
                <Text>{svc.ipv4[0]}</Text>
              </ListItem.SupportingContent>
            </ListItem>
          ))}
        </LazyColumn>
      </PullToRefreshBox>
    </Host>
  )
}
