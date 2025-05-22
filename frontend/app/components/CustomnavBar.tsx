import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import React from 'react';
import Feather from "@expo/vector-icons/Feather";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import Ionicons from "@expo/vector-icons/Ionicons";
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const PRIMARY_COLOR = "#130057";
const SECONDARY_COLOR = "#fff";

const CustomNavBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.container}>
      {state.routes.map((route, index) => {
        console.log("route:", route);

        if (['_sitemap', "+not-found"].includes(route.name)) return null;


        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <AnimatedTouchableOpacity
            layout={LinearTransition.springify().mass(0.5)}
            key={route.key}
            onPress={onPress}
            style={[styles.tabItem, { backgroundColor: isFocused ? SECONDARY_COLOR : "transparent" },

            ]}
          >
            {getIconByRouteName(route.name, isFocused ? PRIMARY_COLOR : SECONDARY_COLOR)}
            {isFocused && <Animated.Text
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(200)}
              style={[styles.text as any]}>
              {label as string}
            </Animated.Text>}
          </AnimatedTouchableOpacity>
        );
      })}
    </View>
  );
  function getIconByRouteName(routeName: string, color: string) {

    switch (routeName) {
      case "index":
        return <Feather name='home' size={30} color={color} />;
      case "profile":
        return <FontAwesome6 name="circle-user" size={30} color={color} />;
      case "sos":
        return <Ionicons name='alert-circle-outline' size={30} color={color} />;
       case "patients":
        return <Ionicons name='alert-circle-outline' size={30} color={color} />;
    }
  }
}
const styles = StyleSheet.create({
  container: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PRIMARY_COLOR,
    width: "1000%",
    alignSelf: "center",
    bottom: 0,
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 15,
    elevation:10,
  },

  tabItem: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 20,
    borderRadius: 30,
  },
  text: {
    color: PRIMARY_COLOR,
    fontSize:18,
    marginLeft: 8,
    
  }
}
)


export default CustomNavBar;