# Système de Modifications de Profil Patient

## Vue d'ensemble

Ce système permet aux patients de demander des modifications de leur profil, qui doivent être approuvées par leur aidant avant d'être appliquées. Cela garantit la sécurité et la validation des changements de données personnelles.

## Architecture

### Backend

#### 1. Modèle de données (`PatientProfileModification.js`)
- Gère les opérations CRUD pour les modifications de profil patient
- Stocke les anciennes et nouvelles valeurs pour comparaison
- Gère les statuts : `pending`, `approved`, `rejected`

#### 2. Contrôleur (`patientProfileModificationController.js`)
- `createModification` : Crée une modification en attente
- `getPendingModifications` : Récupère toutes les modifications en attente
- `getPendingByPatient` : Récupère les modifications d'un patient spécifique
- `approveModification` : Approuve et applique une modification
- `rejectModification` : Rejette une modification
- `getModificationById` : Récupère une modification par ID
- `cleanupOldModifications` : Nettoie les anciennes modifications

#### 3. Routes (`patientProfileModificationRoutes.js`)
- `POST /api/patient-profile-modifications/create` : Créer une modification
- `GET /api/patient-profile-modifications/pending` : Toutes les modifications en attente
- `GET /api/patient-profile-modifications/pending/:patientId` : Modifications d'un patient
- `PUT /api/patient-profile-modifications/approve/:id` : Approuver une modification
- `PUT /api/patient-profile-modifications/reject/:id` : Rejeter une modification
- `GET /api/patient-profile-modifications/:id` : Détails d'une modification
- `DELETE /api/patient-profile-modifications/cleanup` : Nettoyer les anciennes

### Frontend

#### 1. Page de profil patient (`profile.jsx`)
- Affiche les informations actuelles du patient
- Permet de modifier les informations via un modal
- Crée une modification en attente au lieu de modifier directement
- Affiche les modifications en attente
- Bouton "Modifier" devient "En attente..." pendant la soumission

#### 2. Page de notifications aidant (`aidantNotifications.jsx`)
- Trois onglets : Rappels, Aidants, Patients
- Onglet "Patients" affiche les modifications de profil patient en attente
- Permet d'approuver ou rejeter les modifications
- Affiche les détails de comparaison avant/après

#### 3. Composant de modification patient (`PatientProfileModificationCard.jsx`)
- Affiche les détails d'une modification
- Modal avec comparaison côte à côte des valeurs
- Boutons d'approbation et de rejet
- Gestion des états de chargement

#### 4. Page d'accueil aidant (`AccueilAidant.jsx`)
- Compteur de notifications incluant les modifications patient
- Badge avec le nombre total de notifications

## Base de données

### Table `patient_profile_modifications`
```sql
CREATE TABLE patient_profile_modifications (
    id SERIAL PRIMARY KEY,
    patient_id VARCHAR(8) NOT NULL REFERENCES patients(id_patient) ON DELETE CASCADE,
    old_nom VARCHAR(100),
    old_prenom VARCHAR(100),
    old_email VARCHAR(255),
    old_telephone VARCHAR(20),
    old_adresse TEXT,
    old_date_naissance DATE,
    old_profile_image TEXT,
    new_nom VARCHAR(100),
    new_prenom VARCHAR(100),
    new_email VARCHAR(255),
    new_telephone VARCHAR(20),
    new_adresse TEXT,
    new_date_naissance DATE,
    new_profile_image TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP
);
```

## Flux d'utilisation

### 1. Patient modifie son profil
1. Le patient ouvre sa page de profil
2. Clique sur "Modifier"
3. Remplit le formulaire avec les nouvelles informations
4. Clique sur "Enregistrer"
5. Une modification en attente est créée
6. Le bouton affiche "En attente..."

### 2. Aidant reçoit la notification
1. L'aidant voit le badge de notification sur sa page d'accueil
2. Clique sur l'icône de notification
3. Va dans l'onglet "Patients"
4. Voit la liste des modifications en attente

### 3. Aidant examine et décide
1. Clique sur une modification pour voir les détails
2. Compare les anciennes et nouvelles valeurs
3. Décide d'approuver ou rejeter
4. Clique sur "Approuver" ou "Rejeter"

### 4. Application des modifications
1. Si approuvée : les nouvelles valeurs sont appliquées au profil patient
2. Si rejetée : la modification est marquée comme rejetée
3. Le patient est notifié du résultat
4. Le bouton "Modifier" redevient disponible

## Sécurité

- Toutes les routes nécessitent une authentification JWT
- Les modifications sont liées à un patient spécifique
- Seuls les aidants peuvent approuver/rejeter les modifications
- Les anciennes modifications sont automatiquement nettoyées après 30 jours

## Tests

Le fichier `test_patient_profile_modifications.js` contient des tests complets pour :
- Création de modifications
- Récupération des modifications en attente
- Approbation et rejet
- Nettoyage des anciennes modifications

Pour exécuter les tests :
```bash
node backend/test_patient_profile_modifications.js
```

## Configuration

### Variables d'environnement
- `DATABASE_URL` : URL de connexion PostgreSQL
- `JWT_SECRET` : Clé secrète pour les tokens JWT

### Dépendances
- `express` : Framework web
- `pg` : Client PostgreSQL
- `jsonwebtoken` : Gestion des tokens JWT
- `multer` : Gestion des uploads de fichiers

## Améliorations futures

1. **Notifications push** : Envoyer des notifications push aux aidants
2. **Historique des modifications** : Garder un historique complet des changements
3. **Validation automatique** : Validation automatique de certains champs
4. **Workflow d'approbation** : Système d'approbation en plusieurs étapes
5. **Audit trail** : Traçabilité complète des actions
6. **Notifications par email** : Envoyer des emails pour les modifications importantes

## Dépannage

### Problèmes courants

1. **Modification non créée**
   - Vérifier que le patient_id existe dans la table patients
   - Vérifier les permissions de la base de données

2. **Modification non approuvée**
   - Vérifier que l'aidant a les permissions nécessaires
   - Vérifier que la modification est bien en statut "pending"

3. **Compteur de notifications incorrect**
   - Vérifier que toutes les API de comptage fonctionnent
   - Vérifier les permissions d'accès aux routes

### Logs utiles
- Les erreurs sont loggées dans la console du serveur
- Vérifier les logs PostgreSQL pour les erreurs de base de données
- Utiliser les outils de développement du navigateur pour les erreurs frontend 