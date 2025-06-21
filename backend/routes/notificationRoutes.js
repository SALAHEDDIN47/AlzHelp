const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middlewares/authJWT');

// Récupérer toutes les notifications pour l'aidant connecté
router.get('/', verifyToken, notificationController.getNotificationsForAidant);

// Récupérer le nombre de notifications non lues
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

// Marquer toutes les notifications comme lues
router.put('/mark-all-read', verifyToken, notificationController.markAllAsRead);

// Masquer (supprimer logiquement) une notification
router.put('/:id/dismiss', verifyToken, notificationController.dismissNotification);

// Renvoyer une notification
router.put('/:id/resend', verifyToken, notificationController.resendNotification);

module.exports = router;
