import { View, Text } from 'react-native'
import { StyleSheet } from 'react-native'
import React from 'react'

export default function Index() {
  return (
    <View style={styles.viewGroup}>
      <Text style={styles.textGroup}>BUTTON SOS</Text>
    </View>
  )
}
const styles = StyleSheet.create({
  viewGroup: {
    flex: 1, // Pour que le View prenne toute la hauteur
    justifyContent: 'center', // Centre verticalement
    alignItems: 'center', // Centre horizontalement
    backgroundColor: 'white', // Optionnel
  },
  textGroup: {
    fontSize: 30, // Taille du texte
    backgroundColor: 'white',
    padding: 10, // Un peu d'espace autour du texte
    color: 'black', // Couleur du texte pour le contraste
  },
});