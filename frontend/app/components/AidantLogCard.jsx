import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '../../utils/fetchNgrok';

const AidantLogCard = ({ aidantLog, onPress }) => {
  const { aidant, logs } = aidantLog;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'À l\'instant';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays}j`;
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'rappel_modification':
        return { name: 'edit', color: '#FF9800' };
      case 'rappel_ajout':
        return { name: 'add-circle', color: '#4CAF50' };
      case 'rappel_suppression':
        return { name: 'delete', color: '#F44336' };
      case 'confirmation_modification':
        return { name: 'check-circle', color: '#2196F3' };
      default:
        return { name: 'info', color: '#9E9E9E' };
    }
  };

  const getLogBackgroundColor = (type) => {
    switch (type) {
      case 'rappel_modification':
        return '#FFF3E0';
      case 'rappel_ajout':
        return '#E8F5E8';
      case 'rappel_suppression':
        return '#FFEBEE';
      case 'confirmation_modification':
        return '#E3F2FD';
      default:
        return '#F5F5F5';
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête avec info de l'aidant */}
      <View style={styles.aidantHeader}>
        <Image
          source={aidant.image_url ? 
            { uri: `${BASE_URL}/${aidant.image_url}` } : 
            require('../../assets/default-avatar.png')}
          style={styles.aidantImage}
        />
        <View style={styles.aidantInfo}>
          <Text style={styles.aidantName}>{aidant.prenom} {aidant.nom}</Text>
          <Text style={styles.lienFamilial}>{aidant.lien_familial}</Text>
        </View>
        <View style={styles.logCount}>
          <Text style={styles.logCountText}>{logs.length}</Text>
        </View>
      </View>

      {/* Liste des logs */}
      <View style={styles.logsContainer}>
        {logs.map((log, index) => {
          const icon = getLogIcon(log.type);
          const backgroundColor = getLogBackgroundColor(log.type);
          
          return (
            <View key={index} style={[styles.logItem, { backgroundColor }]}>
              <View style={styles.logHeader}>
                <MaterialIcons name={icon.name} size={20} color={icon.color} />
                <Text style={styles.logAction}>{log.action_description}</Text>
                <Text style={styles.logTime}>{formatDate(log.created_at)}</Text>
              </View>
              
              {log.description && (
                <Text style={styles.logDescription} numberOfLines={2}>
                  {log.description}
                </Text>
              )}
              
              {log.type_rappel && log.type_rappel !== 'Profil Patient' && (
                <View style={styles.logType}>
                  <MaterialIcons name="label" size={16} color="#666" />
                  <Text style={styles.logTypeText}>{log.type_rappel}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    overflow: 'hidden',
  },
  aidantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  aidantImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: '#f0f0f0',
  },
  aidantInfo: {
    flex: 1,
  },
  aidantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  lienFamilial: {
    fontSize: 14,
    color: '#666',
  },
  logCount: {
    backgroundColor: '#2A62F9',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  logsContainer: {
    padding: 16,
  },
  logItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2A62F9',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  logAction: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  logDescription: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
    lineHeight: 18,
  },
  logType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logTypeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default AidantLogCard; 