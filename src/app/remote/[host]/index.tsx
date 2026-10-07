import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import ArrowBack from "@expo/material-symbols/arrow_back.xml"
import Home from "@expo/material-symbols/home.xml"
import NoSound from "@expo/material-symbols/no_sound.xml"

import { useTv, PairMessage_Status, RemoteKeyCode } from '@/tv';

import Apps from '@/components/Apps.android';
import RemoteButton from '@/components/RemoteButton.android';
import CodeForm from '@/components/CodeForm.android';
import ErrorMessage from '@/components/ErrorMessage.android';
import TouchPad from '@/components/TouchPad.android';


export default function RemoteScreen() {
  const { host } = useLocalSearchParams()
  const { tvStatus, tvError } = useTv(host as string)

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}>
        {tvStatus !== "CONFIGURED" && <Text>Status: {tvStatus}</Text>}

        {
          tvError &&
          <ErrorMessage error={tvError.status === PairMessage_Status.BAD_SECRET ? "Bad code" : "Mysterious error"} />
        }

        {
          tvStatus === "AWAITING_SECRET" && !tvError &&
          <CodeForm />
        }

        {tvStatus === "CONFIGURED" && !tvError && <Apps style={{ flex: 0.25 }} />}

        {
          tvStatus === "CONFIGURED" &&
          <View style={{ flex: 0.2, display: "flex", flexDirection: "row", gap: 10, width: "100%" }}>
            {
              [
                { k: RemoteKeyCode.KEYCODE_BACK, icon: ArrowBack },
                { k: RemoteKeyCode.KEYCODE_HOME, icon: Home },
                { k: RemoteKeyCode.KEYCODE_VOLUME_MUTE, icon: NoSound },
              ].map((btn, idx) =>
                <RemoteButton style={{ flex: 1 }} key={idx} k={btn.k} icon={btn.icon} />
              )
            }
          </View>
        }

        {tvStatus === "CONFIGURED" && !tvError && <TouchPad style={{ flex: 0.5 }} />}
      </SafeAreaView >
    </GestureHandlerRootView>
  );
}
