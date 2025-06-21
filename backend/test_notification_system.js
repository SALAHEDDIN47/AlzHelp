const pool = require('./config/db');

async function testNotificationSystem() {
  try {
    console.log('🧪 Test du système de notifications...\n');

    // 1. Vérifier que les colonnes existent dans aidant_notifications
    console.log('1. Vérification des colonnes dans aidant_notifications...');
    const aidantNotifColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'aidant_notifications' 
      AND column_name IN ('resend', 'date_resend')
      ORDER BY column_name
    `);
    
    console.log('Colonnes trouvées dans aidant_notifications:');
    aidantNotifColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 2. Vérifier que les colonnes existent dans rappels
    console.log('\n2. Vérification des colonnes dans rappels...');
    const rappelsColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rappels' 
      AND column_name IN ('date_creation_rappel', 'heure_creation_rappel')
      ORDER BY column_name
    `);
    
    console.log('Colonnes trouvées dans rappels:');
    rappelsColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    // 3. Tester la création d'un rappel avec les nouvelles colonnes
    console.log('\n3. Test de création d\'un rappel...');
    const testRappel = await pool.query(`
      INSERT INTO rappels 
      (id_patient, description, type_rappel, date_rappel, heure_rappel, confirmer_rappel, favori, date_creation_rappel, heure_creation_rappel)
      VALUES 
      ('1', 'Test rappel', 'Médicament', CURRENT_DATE, CURRENT_TIME, false, false, CURRENT_DATE, CURRENT_TIME)
      RETURNING id_rappel, date_creation_rappel, heure_creation_rappel
    `);
    
    if (testRappel.rows.length > 0) {
      console.log('✅ Rappel créé avec succès:');
      console.log(`  - ID: ${testRappel.rows[0].id_rappel}`);
      console.log(`  - Date création: ${testRappel.rows[0].date_creation_rappel}`);
      console.log(`  - Heure création: ${testRappel.rows[0].heure_creation_rappel}`);
      
      const rappelId = testRappel.rows[0].id_rappel;
      
      // 4. Tester la création d'une notification
      console.log('\n4. Test de création d\'une notification...');
      const testNotification = await pool.query(`
        INSERT INTO aidant_notifications 
        (id_aidant, id_rappel, type, message, resend, date_resend)
        VALUES 
        ('1', $1, 'non_confirme', 'Test notification', false, null)
        RETURNING id, resend, date_resend
      `, [rappelId]);
      
      if (testNotification.rows.length > 0) {
        console.log('✅ Notification créée avec succès:');
        console.log(`  - ID: ${testNotification.rows[0].id}`);
        console.log(`  - Resend: ${testNotification.rows[0].resend}`);
        console.log(`  - Date resend: ${testNotification.rows[0].date_resend}`);
        
        const notificationId = testNotification.rows[0].id;
        
        // 5. Tester le renvoi de notification
        console.log('\n5. Test de renvoi de notification...');
        const updateNotification = await pool.query(`
          UPDATE aidant_notifications 
          SET resend = TRUE, date_resend = CURRENT_TIMESTAMP 
          WHERE id = $1
          RETURNING id, resend, date_resend
        `, [notificationId]);
        
        if (updateNotification.rows.length > 0) {
          console.log('✅ Notification renvoyée avec succès:');
          console.log(`  - ID: ${updateNotification.rows[0].id}`);
          console.log(`  - Resend: ${updateNotification.rows[0].resend}`);
          console.log(`  - Date resend: ${updateNotification.rows[0].date_resend}`);
        }
        
        // 6. Nettoyer les données de test
        console.log('\n6. Nettoyage des données de test...');
        await pool.query('DELETE FROM aidant_notifications WHERE id = $1', [notificationId]);
        await pool.query('DELETE FROM rappels WHERE id_rappel = $1', [rappelId]);
        console.log('✅ Données de test supprimées');
      }
    }

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await pool.end();
  }
}

// Exécuter les tests
testNotificationSystem(); 