import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle } from 'react-native-svg';

const logoutButton = require("../../assets/images/logoutbutton.jpeg");
const returnButton = require("../../assets/images/returnButton.png");

const CIRCLE_LENGTH = 100 * Math.PI; // 100 is radius*2

export default function ConfirmLogout({ visible, onClose }) {
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
        easing: Easing.linear,
      }).start(() => {
        onClose(); // Retour automatique après cercle complet
      });
    } else {
      progress.setValue(0);
      clearTimeout(timeoutRef.current);
    }
  }, [visible]);

  const handleLogout = async () => {
    setLogoutLoading(true);
    setTimeout(async () => {
      await AsyncStorage.removeItem('token');
      Alert.alert("Vous êtes déconnecté");
      router.replace("../../SignIn");
    }, 1000);
  };

  const handleManualReturn = () => {
    onClose(); // Retour immédiat si bouton pressé
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_LENGTH, 0],
  });

  if (!visible) return null;

  return (
    <Modal transparent={true} animationType="slide" visible={visible} >
      <View style={styles.overlay}>
        <View style={styles.Modalcontent}>
        <StatusBar hidden={true} />
        <View style={styles.sheet}> 
          <Text style={styles.title}>
  Appuyez sur "Déconnexion" pour quitter votre session. Sinon, appuyez sur "Retour".
          </Text>

          <View style={styles.buttonsRow}>
            <TouchableOpacity onPress={handleLogout} style={styles.button}>
              <Image source={logoutButton} style={styles.icon} />
              <Text style={styles.labeldeconnexion}>
                {logoutLoading ? "en cours..." : "Déconnexion"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleManualReturn} style={styles.button}>
              <View style={styles.svgWrapper}>
                <Svg width={70} height={77}>
                  <Circle
                    cx={35}
                    cy={35}
                    r={32}
                    stroke="#ccc"
                    strokeWidth={6}
                    fill="none"
                  />
                  <AnimatedCircle
                    cx={35}
                    cy={35}
                    r={33}
                    stroke="#00cc00"
                    strokeWidth={7}
                    fill="none"
                    strokeDasharray={CIRCLE_LENGTH}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                 
                </Svg>
                <Image
                  source={returnButton}
                  style={[styles.icon, { position: 'absolute', top: 5, left: 5 }]}
                />
              </View>
              <Text style={styles.labelretour}>Retour</Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </View>
    </Modal>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  Modalcontent:{
      
       backgroundColor: '#F6FDFF',
  borderRadius: 50,
  padding: 20,
  height:'40%',
  width: '100%',
  alignItems: 'center',
  },
  overlay: {
    zIndex:5,
    marginTop:-50,
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    backgroundColor: "#F6FDFF",
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    paddingTop: 70,
    
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  button: {
    alignItems: "center",
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  labelretour: {
     marginTop: 0,
    fontSize: 17,
    color: 'green',
    backgroundColor:"white",
    borderRadius:30,
    padding:5,
    elevation:5,
    borderColor:'green',
    borderWidth:2,
  },
  labeldeconnexion:{
    marginTop: 8,
    fontSize: 15,
    color: "red",
    backgroundColor:'white',
    borderRadius:30,
    padding:5,
    elevation:5,
    borderColor:'red',
    borderWidth:2,
  },
  svgWrapper: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

