const PatientProfileModification = require('./models/PatientProfileModification');
const pool = require('./config/db');

async function testPatientProfileModifications() {
  console.log('🧪 Test du système de modifications de profil patient...\n');

  try {
    // Test 1: Créer une modification
    console.log('1. Test de création d\'une modification...');
    const oldData = {
      nom: 'Dupont',
      prenom: 'Jean',
      email: 'jean.dupont@email.com',
      telephone: '0123456789',
      adresse: '123 Rue de la Paix',
      datenaissance: '1950-01-01',
      profile_image: null
    };

    const newData = {
      nom: 'Dupont',
      prenom: 'Jean-Pierre',
      email: 'jean-pierre.dupont@email.com',
      telephone: '0987654321',
      adresse: '456 Avenue des Fleurs',
      datenaissance: '1950-01-01',
      profile_image: 'uploads/profiles/new-profile.jpg'
    };

    const modification = await PatientProfileModification.create('PAT001', oldData, newData);
    console.log('✅ Modification créée:', modification.id);

    // Test 2: Récupérer les modifications en attente pour un patient
    console.log('\n2. Test de récupération des modifications en attente...');
    const pendingModifications = await PatientProfileModification.getPendingByPatient('PAT001');
    console.log('✅ Modifications en attente trouvées:', pendingModifications.length);

    // Test 3: Récupérer toutes les modifications en attente
    console.log('\n3. Test de récupération de toutes les modifications en attente...');
    const allPending = await PatientProfileModification.getAllPending();
    console.log('✅ Toutes les modifications en attente:', allPending.length);

    // Test 4: Approuver une modification
    console.log('\n4. Test d\'approbation d\'une modification...');
    const approvedModification = await PatientProfileModification.approve(modification.id);
    console.log('✅ Modification approuvée:', approvedModification.status);

    // Test 5: Vérifier que la modification n'est plus en attente
    console.log('\n5. Vérification que la modification n\'est plus en attente...');
    const remainingPending = await PatientProfileModification.getPendingByPatient('PAT001');
    console.log('✅ Modifications en attente restantes:', remainingPending.length);

    // Test 6: Créer une autre modification pour tester le rejet
    console.log('\n6. Test de création d\'une deuxième modification...');
    const modification2 = await PatientProfileModification.create('PAT002', oldData, newData);
    console.log('✅ Deuxième modification créée:', modification2.id);

    // Test 7: Rejeter une modification
    console.log('\n7. Test de rejet d\'une modification...');
    const rejectedModification = await PatientProfileModification.reject(modification2.id);
    console.log('✅ Modification rejetée:', rejectedModification.status);

    // Test 8: Nettoyer les anciennes modifications
    console.log('\n8. Test de nettoyage des anciennes modifications...');
    await PatientProfileModification.cleanupOld();
    console.log('✅ Nettoyage terminé');

    console.log('\n🎉 Tous les tests sont passés avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  testPatientProfileModifications();
}

module.exports = { testPatientProfileModifications }; 