# Système de Modifications de Profil en Attente

## Vue d'ensemble

Ce système permet aux aidants de proposer des modifications à leur profil qui doivent être approuvées avant d'être appliquées. Cela garantit un contrôle qualité et une validation des changements.

## Fonctionnalités

### Pour l'Aidant (Frontend)
1. **Modification du profil** : L'aidant peut modifier ses informations
2. **État en attente** : Le bouton "Modifier" affiche "En attente..." pendant le processus
3. **Notification** : L'aidant est informé que sa modification est en attente d'approbation
4. **Suivi** : Affichage des modifications en attente sur la page de profil

### Pour l'Administrateur/Aidant Principal (Frontend)
1. **Notifications** : Nouvel onglet "Profils" dans la page de notifications
2. **Approbation/Rejet** : Boutons pour approuver ou rejeter les modifications
3. **Détails** : Modal pour voir les changements avant/après
4. **Compteur** : Badge de notifications incluant les modifications en attente

### Backend
1. **Table `profile_modifications`** : Stockage des modifications en attente
2. **API REST** : Endpoints pour gérer les modifications
3. **Validation** : Vérification des données avant création
4. **Application automatique** : Les modifications approuvées sont automatiquement appliquées

## Structure de la Base de Données

### Table `profile_modifications`
```sql
CREATE TABLE profile_modifications (
    id SERIAL PRIMARY KEY,
    aidant_id INTEGER NOT NULL REFERENCES aidants(id_aidant) ON DELETE CASCADE,
    old_nom VARCHAR(100),
    old_prenom VARCHAR(100),
    old_email VARCHAR(255),
    old_telephone VARCHAR(20),
    old_date_naissance DATE,
    old_image_url TEXT,
    new_nom VARCHAR(100),
    new_prenom VARCHAR(100),
    new_email VARCHAR(255),
    new_telephone VARCHAR(20),
    new_date_naissance DATE,
    new_image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP
);
```

## API Endpoints

### Créer une modification
```
POST /api/profile-modifications/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "aidantId": 123,
  "oldData": { ... },
  "newData": { ... }
}
```

### Obtenir toutes les modifications en attente
```
GET /api/profile-modifications/pending
Authorization: Bearer <token>
```

### Obtenir les modifications d'un aidant
```
GET /api/profile-modifications/pending/:aidantId
Authorization: Bearer <token>
```

### Approuver une modification
```
PUT /api/profile-modifications/approve/:modificationId
Authorization: Bearer <token>
```

### Rejeter une modification
```
PUT /api/profile-modifications/reject/:modificationId
Authorization: Bearer <token>
```

### Obtenir une modification par ID
```
GET /api/profile-modifications/:modificationId
Authorization: Bearer <token>
```

## Flux d'Utilisation

### 1. L'Aidant Modifie Son Profil
1. L'aidant va sur sa page de profil
2. Clique sur "Modifier"
3. Modifie ses informations
4. Clique sur "Enregistrer"
5. Le système crée une modification en attente
6. Le bouton affiche "En attente..."
7. L'aidant reçoit une notification

### 2. L'Administrateur Approuve/Rejette
1. L'administrateur va dans les notifications
2. Clique sur l'onglet "Profils"
3. Voit la liste des modifications en attente
4. Clique sur l'icône "œil" pour voir les détails
5. Approuve ou rejette la modification

### 3. Application des Modifications
1. Si approuvée : Les modifications sont appliquées au profil de l'aidant
2. Si rejetée : La modification est marquée comme rejetée
3. L'aidant est notifié du résultat
4. Le bouton "Modifier" redevient actif

## Fichiers Modifiés/Créés

### Backend
- `models/ProfileModification.js` - Modèle pour les modifications
- `controllers/profileModificationController.js` - Contrôleur
- `routes/profileModificationRoutes.js` - Routes API
- `controllers/aidantController.js` - Modifié pour créer des modifications en attente
- `app.js` - Ajout des nouvelles routes
- `init.sql` - Création de la table

### Frontend
- `app/profileAidant.jsx` - Modifié pour gérer l'état en attente
- `app/aidantNotifications.jsx` - Ajout de l'onglet "Profils"
- `app/components/ProfileModificationCard.jsx` - Nouveau composant
- `app/AccueilAidant.jsx` - Compteur de notifications mis à jour

## Test du Système

Pour tester le système :

```bash
# Dans le dossier backend
node test_profile_modifications.js
```

Ce script va :
1. Vérifier que la table existe
2. Créer une modification de test
3. Tester l'approbation
4. Appliquer les modifications
5. Nettoyer les données de test

## Sécurité

- Toutes les routes sont protégées par authentification JWT
- Validation des données côté serveur
- Vérification des permissions avant approbation/rejet
- Nettoyage automatique des anciennes modifications (30 jours)

## Maintenance

### Nettoyage Automatique
Les modifications approuvées ou rejetées sont automatiquement supprimées après 30 jours.

### Monitoring
- Surveiller le nombre de modifications en attente
- Vérifier les temps de réponse d'approbation
- Analyser les taux d'approbation/rejet

## Améliorations Futures

1. **Notifications push** pour les nouvelles modifications
2. **Historique des modifications** pour chaque aidant
3. **Commentaires** sur les rejets
4. **Workflow multi-niveaux** d'approbation
5. **Export** des modifications pour audit 