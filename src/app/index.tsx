import { useCallback } from 'react';
import { View } from 'react-native';
import { useZeroconf } from "react-native-zeroconf"
import { useFocusEffect } from 'expo-router';

import ServiceList from '@/components/ServiceList.android';
import ErrorComponent from '@/components/ErrorMessage.android';

export default function IndexScreen() {
  const { services, isScanning, error, restart, stop } = useZeroconf({ type: "androidtvremote2" })

  useFocusEffect(useCallback(() => {
    console.log("restart")
    restart()
    return () => {
      console.log("stop")
      stop()
    }
  }, []))

  return (
    <View>
      {
        error
          ? <ErrorComponent error={error.message} />
          : <ServiceList services={services} refreshing={isScanning} onRefresh={restart} />
      }
    </View>
  );
}
