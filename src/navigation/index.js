import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import IntroScreen from "../screens/IntroScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import ProfileDetailsScreen from "../screens/ProfileDetailsScreen";
import InterestsScreen from "../screens/InterestsScreen";
import HomeScreen from "../screens/HomeScreen";
import MatchesScreen from "../screens/MatchesScreen";
import ChatsScreen from "../screens/ChatsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import ChatScreen from "../screens/ChatScreen";
import { Ionicons } from "@expo/vector-icons";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: "center",
        tabBarIcon: ({ color, size }) => {
          const iconMap = {
            Home: "heart",
            Matches: "people",
            Chats: "chatbubbles",
            Perfil: "person"
          };
          return <Ionicons name={iconMap[route.name]} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Principal" }} />
      <Tab.Screen name="Matches" component={MatchesScreen} options={{ title: "Matches" }} />
      <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: "Chats" }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: "Seu Perfil" }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Intro" component={IntroScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Entrar" }} />
      <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Criar conta" }} />
      <Stack.Screen name="ProfileDetails" component={ProfileDetailsScreen} options={{ title: "Detalhes do Perfil" }} />
      <Stack.Screen name="Interests" component={InterestsScreen} options={{ title: "Interesses" }} />
      <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Chat" }} />
    </Stack.Navigator>
  );
}


