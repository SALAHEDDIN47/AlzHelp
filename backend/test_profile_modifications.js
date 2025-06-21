const pool = require('./config/db');

async function testProfileModifications() {
  try {
    console.log('🧪 Test du système de modifications de profil...\n');

    // 1. Vérifier que la table existe
    console.log('1. Vérification de la table profile_modifications...');
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'profile_modifications'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Table profile_modifications existe');
    } else {
      console.log('❌ Table profile_modifications n\'existe pas');
      return;
    }

    // 2. Vérifier qu'il y a des aidants dans la base
    console.log('\n2. Vérification des aidants existants...');
    const aidants = await pool.query('SELECT id_aidant, nomaidant, prenomaidant FROM aidants LIMIT 3');
    
    if (aidants.rows.length === 0) {
      console.log('❌ Aucun aidant trouvé dans la base');
      return;
    }
    
    console.log(`✅ ${aidants.rows.length} aidant(s) trouvé(s)`);
    const testAidant = aidants.rows[0];
    console.log(`   Aidant de test: ${testAidant.prenomaidant} ${testAidant.nomaidant} (ID: ${testAidant.id_aidant})`);

    // 3. Créer une modification de test
    console.log('\n3. Création d\'une modification de test...');
    const oldData = {
      nom: testAidant.nomaidant,
      prenom: testAidant.prenomaidant,
      email: 'test@example.com',
      telephone: '0123456789',
      dateNaissance: '1990-01-01',
      image_url: null
    };
    
    const newData = {
      nom: testAidant.nomaidant,
      prenom: testAidant.prenomaidant + ' (modifié)',
      email: 'test.modifie@example.com',
      telephone: '0987654321',
      dateNaissance: '1990-01-01',
      image_url: null
    };

    const insertQuery = `
      INSERT INTO profile_modifications 
      (aidant_id, old_nom, old_prenom, old_email, old_telephone, old_date_naissance, old_image_url,
       new_nom, new_prenom, new_email, new_telephone, new_date_naissance, new_image_url, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending')
      RETURNING *
    `;
    
    const values = [
      testAidant.id_aidant,
      oldData.nom,
      oldData.prenom,
      oldData.email,
      oldData.telephone,
      oldData.dateNaissance,
      oldData.image_url,
      newData.nom,
      newData.prenom,
      newData.email,
      newData.telephone,
      newData.dateNaissance,
      newData.image_url
    ];

    const modification = await pool.query(insertQuery, values);
    console.log('✅ Modification de test créée');
    console.log(`   ID: ${modification.rows[0].id}`);

    // 4. Vérifier que la modification existe
    console.log('\n4. Vérification de la modification créée...');
    const checkModification = await pool.query(`
      SELECT pm.*, a.nomaidant as current_nom, a.prenomaidant as current_prenom
      FROM profile_modifications pm
      JOIN aidants a ON pm.aidant_id = a.id_aidant
      WHERE pm.id = $1
    `, [modification.rows[0].id]);

    if (checkModification.rows.length > 0) {
      console.log('✅ Modification trouvée');
      const mod = checkModification.rows[0];
      console.log(`   Status: ${mod.status}`);
      console.log(`   Aidant: ${mod.current_prenom} ${mod.current_nom}`);
      console.log(`   Changement: ${mod.old_prenom} → ${mod.new_prenom}`);
    } else {
      console.log('❌ Modification non trouvée');
    }

    // 5. Tester l'approbation
    console.log('\n5. Test de l\'approbation...');
    const approveQuery = `
      UPDATE profile_modifications 
      SET status = 'approved', approved_at = NOW()
      WHERE id = $1 AND status = 'pending'
      RETURNING *
    `;
    
    const approved = await pool.query(approveQuery, [modification.rows[0].id]);
    
    if (approved.rows.length > 0) {
      console.log('✅ Modification approuvée');
      
      // Appliquer les modifications au profil de l'aidant
      const updateAidantQuery = `
        UPDATE aidants 
        SET prenomaidant = $1, emailaidant = $2, telephaidant = $3
        WHERE id_aidant = $4
        RETURNING *
      `;
      
      const updatedAidant = await pool.query(updateAidantQuery, [
        newData.prenom,
        newData.email,
        newData.telephone,
        testAidant.id_aidant
      ]);
      
      if (updatedAidant.rows.length > 0) {
        console.log('✅ Profil aidant mis à jour');
        console.log(`   Nouveau prénom: ${updatedAidant.rows[0].prenomaidant}`);
      } else {
        console.log('❌ Erreur mise à jour profil aidant');
      }
    } else {
      console.log('❌ Erreur approbation modification');
    }

    // 6. Nettoyer les données de test
    console.log('\n6. Nettoyage des données de test...');
    await pool.query('DELETE FROM profile_modifications WHERE id = $1', [modification.rows[0].id]);
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 Test terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter le test
testProfileModifications(); 