import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation";

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['@firebase/auth']);

export default function App() {
  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: '#FF4D67',
          background: '#FFF5F7',
          card: '#FFF5F7',
          text: '#1a1a1a',
          border: 'transparent',
          notification: '#FF4D67',
        },
      }}
    >
      <StatusBar style="dark" />
      <RootNavigator />
    </NavigationContainer>
  );
}


