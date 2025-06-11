import { View, Text, Image, StyleSheet, TouchableOpacity, Modal, Linking, Alert } from "react-native";
import { router, useLocalSearchParams,  useRouter } from "expo-router";
import { useState } from "react";
import * as Speech from 'expo-speech';
import { Ionicons, MaterialIcons,  } from '@expo/vector-icons';

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
    const msg = `C'est ton aidant : ${parsedAidant.prenomaidant} ${parsedAidant.nomaidant} son âge est ${age} ans. Pour le contacter, vous pouvez cliquer sur l'un des boutons devant vous.`;
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
            <Image source={{ uri: parsedAidant.image_url }} style={styles.zoomedImage} />
          </TouchableOpacity>
        </View>
      </Modal>

      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image source={{ uri: parsedAidant.image_url }} style={styles.image} />
      </TouchableOpacity>

      <Text style={styles.name}>{parsedAidant.prenomaidant} {parsedAidant.nomaidant}</Text>
      <Text style={styles.date}>Ajouté le : {new Date(parsedAidant.created_at).toLocaleDateString("fr-FR")}</Text>

      <View style={styles.boxseparator} >
          <Ionicons name="logo-microsoft" size={30} color="#3A676D" />
      </View>

      {/* Boutons */}
      <View style={styles.grid}>
        <TouchableOpacity style={[styles.box, { backgroundColor: '#e74c3c' }]} onPress={() => Linking.openURL(`mailto:${parsedAidant.emailaidant}`)}>
          <MaterialIcons name="email" size={45} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.box, { backgroundColor: '#3498db' }]} onPress={() => Linking.openURL(`tel:${parsedAidant.telephaidant}`)}>
          <Ionicons name="call" size={45} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.box, { backgroundColor: '#e67e22' }]} onPress={() => Linking.openURL(`sms:${parsedAidant.telephaidant}`)}>
          <Ionicons name="chatbubble" size={45} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.box, { backgroundColor: '#f1c40f' }]} onPress={speakInfo}>
          <Ionicons name="mic-outline" size={45} color="white" />
        </TouchableOpacity>
      </View>

       <View style={styles.container}>
  <Text style={styles.info}>📧 {parsedAidant.emailaidant}</Text>
  <View style={styles.separator} />

  <Text style={styles.info}>📞 {parsedAidant.telephaidant}</Text>
  <View style={styles.separator} />

  <Text style={styles.info}>🎂 {new Date(parsedAidant.d_naissanceaidant).toLocaleDateString("fr-FR")}</Text>
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
  container: { flex: 1, alignItems: "center", padding: 20, backgroundColor: "#f2f2f2" },
  image: { width: 200, height: 150, borderRadius: 75, marginBottom: 10, marginTop: 30 },
  zoomedImage: { width: 300, height: 300, borderRadius: 150 },
  zoomedImageContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  modalBackground: { backgroundColor: 'rgba(0,0,0,0.8)', flex: 1 },

  name: { fontSize: 30, fontWeight: "bold", marginTop: 20, textAlign: "center" },
  date: { fontSize: 20, color: "#666", marginBottom: 20 },
  info:{fontSize: 18, color: "#666", marginBottom: 1, marginTop:1,},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 0,
    marginBottom:35,
  },
  box: {
    width: 130,
    height: 100,
    margin: 15,
    marginBottom:5,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  boxseparator:{
    backgroundColor:'#EDF0F1',
    width: 500,
    height: 50,
    marginTop:0,
    marginBottom:10,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
    borderColor:"#3A676D",
  },
  return:{
    flex:1,
   backgroundColor:'transparent',
   position:'absolute',
   marginTop:50,
   alignSelf:'flex-end',

  },
  separator: {
    height: 1,
    width:300,
    backgroundColor: 'gray',
    marginVertical: 7,
  },
  error: { fontSize: 18,
     color: "red",
      marginTop: 20
  },
});
