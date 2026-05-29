const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Pointing to your local SQLite/Neon db layer

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'sleekops_quantum_jwt_secret_key_2026';

/**
 * POST /api/auth/google
 * Processes the official Google Identity credential JWT token payload,
 * synchronizes user data locally, and issues an application-level session JWT.
 */
router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Handshake failed: idToken payload is missing.' });
  }

  try {
    // 1. Verify the literal ID Token string directly with Google's security infrastructure
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ success: false, error: 'Google validation failed: Profile payload empty.' });
    }

    const { email, name, picture, sub: googleId } = payload;

    // Detect if database driver is Cloud Postgres ($1 syntax) or local SQLite (? syntax)
    const isPostgres = typeof db.query === 'function' && !db.all;
    let user;

    if (isPostgres) {
      // 🐘 Cloud Neon Postgres Path
      const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      user = userQuery.rows[0];
      
      if (!user) {
        const userUuid = `USR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const insertQuery = await db.query(
          `INSERT INTO users (id, email, name, profile_picture, google_id) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id, email, name, profile_picture`,
          [userUuid, email, name, picture, googleId]
        );
        user = insertQuery.rows[0];
      }
    } else {
      // 💾 Local SQLite Path (Standardized loop handles for your current running state)
      user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });

      if (!user) {
        const userUuid = `USR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        user = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO users (id, email, name, profile_picture, google_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [userUuid, email, name, picture, googleId],
            function (err) {
              if (err) reject(err);
              else {
                resolve({
                  id: userUuid,
                  email,
                  name,
                  profile_picture: picture
                });
              }
            }
          );
        });
      }
    }

    // 2. Generate a stateless SleekOps Session JWT for the React UI layer
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        name: user.name,
        email: user.email,
        picture: user.profile_picture
      }
    });

  } catch (error) {
    console.error('[Backend Auth Exception]:', error.message);
    return res.status(400).json({
      success: false,
      error: 'Internal token validation cycle broken.',
      detail: error.message
    });
  }
});

module.exports = router;