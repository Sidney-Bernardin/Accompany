import * as Device from 'expo-device';
import { Platform, TextInput, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedIcon } from '@/components/animated-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WebBadge } from '@/components/web-badge';
import { Colors, BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

import { useTv } from '@/hooks/use-tv';


function getDevMenuHint() {
  if (Platform.OS === 'web') {
    return <ThemedText type="small">use browser devtools</ThemedText>;
  }
  if (Device.isDevice) {
    return (
      <ThemedText type="small">
        shake device or press <ThemedText type="code">m</ThemedText> in terminal
      </ThemedText>
    );
  }
  const shortcut = Platform.OS === 'android' ? 'cmd+m (or ctrl+m)' : 'cmd+d';
  return (
    <ThemedText type="small">
      press <ThemedText type="code">{shortcut}</ThemedText>
    </ThemedText>
  );
}

export default function HomeScreen() {
  const { status, error, sendSecret, sendKey } = useTv("10.10.8.53")

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedView style={styles.heroSection}>
          <AnimatedIcon />
          <ThemedText type="title" style={styles.title}>
            Accompany
          </ThemedText>
        </ThemedView>

        <ThemedText type="code" style={styles.code}>
          {status}
        </ThemedText>

        <ThemedText type="code" style={styles.code}>
          {error}
        </ThemedText>

        {
          status === "PAIRING" &&
          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <ThemedText nativeID="codeLebel">Code:</ThemedText>
            <TextInput
              style={{
                backgroundColor: Colors.dark.backgroundSelected,
                borderRadius: Spacing.four,
                paddingVertical: Spacing.two,
                paddingHorizontal: Spacing.four,
              }}
              placeholder="Code"
              accessibilityLabel="codeLebel"
              onSubmitEditing={(ev) => sendSecret(ev.nativeEvent.text)}
            />
          </ThemedView>
        }

        {
          status === "PAIRED" &&
          <ThemedView type="backgroundElement" style={styles.stepContainer}>
            <Button onPress={() => sendKey("UP")} />
            <Button onPress={() => sendKey("UP")} />
          </ThemedView>
        }

        {Platform.OS === 'web' && <WebBadge />}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  title: {
    textAlign: 'center',
  },
  code: {
    textTransform: 'uppercase',
  },
  stepContainer: {
    gap: Spacing.three,
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.four,
    backgroundColor: Colors.dark.backgroundElement,
  },
});
