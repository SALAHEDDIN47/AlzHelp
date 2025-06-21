import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Linking, Alert } from "react-native";
import { router, useLocalSearchParams,  useRouter } from "expo-router";
import { useState } from "react";
import * as Speech from 'expo-speech';
import { Ionicons, MaterialIcons,  } from '@expo/vector-icons';
import { BASE_URL } from "../utils/fetchNgrok";

export default function DetailsAidant() {
  const { aidant } = useLocalSearchParams();
  const [modalVisible, setModalVisible] = useState(false);
   const handleManualReturn = () => {
    router.back();
  };

  if (!aidant) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>❌ Aucun aidant fourni.</Text>
      </View>
    );
  }

  let parsedAidant;
  try {
    parsedAidant = JSON.parse(decodeURIComponent(aidant));
  } catch (e) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>❌ Erreur lors du parsing des données.</Text>
      </View>
    );
  }

  const speakInfo = () => {
    const age = new Date().getFullYear() - new Date(parsedAidant.d_naissanceaidant).getFullYear();
    const msg = `C'est ton aidant : ${parsedAidant.prenomaidant} ${parsedAidant.nomaidant}, le lien familial est, ${parsedAidant.lien_familial}. Pour le contacter, vous pouvez cliquer sur l'un des boutons devant vous.`;
     Speech.speak(msg, {
    language: 'fr-FR', // ⬅️ Ceci force le français
  });
  };

  return (

    
    <View style={styles.container}>
      <TouchableOpacity style={styles.return} onPress={handleManualReturn}>
          <Ionicons name="arrow-back-outline"size={45} color="#3A676D" />
        </TouchableOpacity>

      {/* Zoom modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.zoomedImageContainer}>
            <Image 
              source={
                parsedAidant.image_url 
                  ? { uri: `${BASE_URL}/${parsedAidant.image_url}` }
                  : require('../assets/images/aidant_image.png')
              } 
              style={styles.zoomedImage} 
            />
          </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image 
          source={
            parsedAidant.image_url 
              ? { uri: `${BASE_URL}/${parsedAidant.image_url}` }
              : require('../assets/images/aidant_image.png')
          } 
          style={styles.image} 
        />
      </TouchableOpacity>

         <View style={styles.headerRow}>
  <View style={styles.infos}>
    <Text style={styles.name}>{parsedAidant.prenomaidant} {parsedAidant.nomaidant}</Text>
    <Text style={styles.lien}>{parsedAidant.lien_familial}</Text>
  </View>
  <TouchableOpacity style={styles.micro} onPress={speakInfo}>
    <Ionicons name="mic-outline" size={40} color="black" />
  </TouchableOpacity>
</View>



      <View style={styles.grid}>
        <TouchableOpacity style={[styles.box, { backgroundColor: '#e74c3c' }]} onPress={() => Linking.openURL(`mailto:${parsedAidant.emailaidant}`)}>
          <MaterialIcons name="email" size={45} color="white" />
        </TouchableOpacity>

  

        <TouchableOpacity style={[styles.box, { backgroundColor: '#e67e22' }]} onPress={() => Linking.openURL(`sms:${parsedAidant.telephaidant}`)}>
          <Ionicons name="chatbubble" size={45} color="white" />
        </TouchableOpacity>


              <TouchableOpacity style={[styles.box, { backgroundColor: '#3498db' }]} onPress={() => Linking.openURL(`tel:${parsedAidant.telephaidant}`)}>
          <Ionicons name="call" size={45} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.boxseparator} >
          <Ionicons name="logo-microsoft" size={30} color="#3A676D" />
      </View>

       <View style={styles.container}>
  <Text style={styles.info}>📧 {parsedAidant.emailaidant}</Text>
  <View style={styles.separator} />

  <Text style={styles.info}>📞 {parsedAidant.telephaidant}</Text>
  <View style={styles.separator} />

  <Text style={styles.info}>🎂 {new Date().getFullYear() - new Date(parsedAidant.d_naissanceaidant).getFullYear()} ans</Text>
  <View style={styles.separator} />

  <Text style={styles.info}>
    📅 Ajouté le :{" "}
    {new Date(parsedAidant.created_at).toLocaleDateString("fr-FR")}
  </Text>
</View>






    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    alignItems: "center", 
    padding: 20, 
    backgroundColor: "#f2f2f2",
    paddingTop: 30,
  },
  image: { 
    width: 180, 
    height: 180, 
    borderRadius: 90, 
    marginBottom: 20, 
    marginTop: 20,
    borderWidth: 4,
    borderColor: "#3A676D",
    elevation: 8,
  },
  zoomedImage: { 
    width: 350, 
    height: 350, 
    borderRadius: 175,
    borderWidth: 6,
    borderColor: "#3A676D",
  },
  zoomedImageContainer: { 
    justifyContent: 'center', 
    alignItems: 'center', 
    flex: 1,
    padding: 20,
  },
  modalBackground: { 
    backgroundColor: 'rgba(0,0,0,0.9)', 
    flex: 1,
  },

  name: { 
    fontSize: 28, 
    fontWeight: "bold", 
    marginTop: 15, 
    textAlign: "left",
    color: "#2c3e50",
  },
  lien: { 
    fontSize: 18, 
    color: "#7f8c8d", 
    marginBottom: 15, 
    textAlign: "left",
    fontStyle: "italic",
  },
  info:{
    fontSize: 18, 
    color: "#666", 
    marginBottom: 1, 
    marginTop: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 0,
    marginBottom: 10,
    marginTop: 5,
  },
  infos:{
    flex: 1,
    alignItems: "flex-start",
    paddingLeft: 30,
    paddingRight: 20,
  },
  box: {
    width: 120,
    height: 90,
    margin: 12,
    marginBottom: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 15,
    paddingHorizontal: 15,
  },
  micro:{
    width: 55,
    height: 70,
    marginTop: 0,
    marginBottom: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    borderColor: "#3A676D",
    backgroundColor: '#f8f9fa',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  boxseparator:{
    backgroundColor: '#EDF0F1',
    width: 500,
    height: 40,
    marginTop: 0,
    marginBottom: 3,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    borderColor: "#3A676D",
  },
  return: {
    position: 'absolute',
    top: 60,
    left: 25,
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 25,
    padding: 5,
    elevation: 5,
  },

  separator: {
    height: 1,
    width: 300,
    backgroundColor: 'gray',
    marginVertical: 7,
  },
  error: { 
    fontSize: 18,
    color: "red",
    marginTop: 20
  },
});
