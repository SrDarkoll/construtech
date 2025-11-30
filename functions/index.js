
const functions = require('firebase-functions');
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Función invocable desde el cliente para verificar si el email existe en Firestore
exports.checkEmailInDB = functions.https.onCall(async (data, context) => {
  const email = data.email;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'The function must be called with an "email" argument.');
  }

  try {
    // Verificamos en la colección 'usuarios'
    const snapshot = await admin.firestore().collection('usuarios').where('email', '==', email).get();
    return { exists: !snapshot.empty };
  } catch (error) {
    console.error("Error checking email in DB:", error);
    throw new functions.https.HttpsError('internal', 'Error checking email in database', error);
  }
});

/*
// SCRIPT ORIGINAL (COMENTADO)
// const admin = require('firebase-admin');
// const serviceAccount = require('./serviceAccountKey.json'); 
// admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
// const targetUid = '0pbMY7a6wXQc9OYFh6myP6wp8uF2'; 
// const claims = { admin: true }; 
// ...
*/