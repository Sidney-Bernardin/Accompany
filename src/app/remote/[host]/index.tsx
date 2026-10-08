import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from "expo-keep-awake"
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { VolumeManager } from 'react-native-volume-manager';

import ArrowBack from "@expo/material-symbols/arrow_back.xml"
import Home from "@expo/material-symbols/home.xml"
import NoSound from "@expo/material-symbols/no_sound.xml"

import { useTv, PairMessage_Status, RemoteKeyCode, sendKey, RemoteDirection } from '@/tv';

import Apps from '@/components/Apps.android';
import RemoteButton from '@/components/RemoteButton.android';
import CodeForm from '@/components/CodeForm.android';
import ErrorMessage from '@/components/ErrorMessage.android';
import TouchPad from '@/components/TouchPad.android';
import Spinner from '@/components/Spinner.android';


export default function RemoteScreen() {
  useKeepAwake()

  const { host } = useLocalSearchParams()
  const { tvStatus, tvError } = useTv(host as string)
  const volume = useRef(0.5)

  useEffect(() => {
    VolumeManager.getVolume()
      .then((v) => volume.current = v.volume)

    const listiner = VolumeManager.addVolumeListener((res) => {
      if (volume.current < res.volume)
        sendKey(RemoteKeyCode.KEYCODE_VOLUME_UP, RemoteDirection.SHORT)
      else if (volume.current > res.volume)
        sendKey(RemoteKeyCode.KEYCODE_VOLUME_DOWN, RemoteDirection.SHORT)

      volume.current = res.volume
    })

    return () => {
      listiner.remove()
    }
  }, [])

  return (
    <GestureHandlerRootView>
      <SafeAreaView style={{
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }}>
        {
          tvStatus === "CONNECTING" &&
          <View style={{ position: "fixed", display: "flex", width: "100%", height: "100%", justifyContent: "center", alignItems: "center" }}>
            <Spinner style={{ position: "absolute" }} />
          </View>
        }

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
