const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Pointing to your Neon Postgres pg client pool

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'sleekops_quantum_jwt_secret_key_2026';

/**
 * POST /api/auth/google
 * Verifies Google ID Token, handles user creation inside Postgres, and issues a JWT.
 */
router.post('/google', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, error: 'Google ID token missing.' });
  }

  try {
    // 1. Verify the token directly with Google's verification servers
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // 2. Query Neon Postgres using standard client array extraction ($1 syntax)
    const userQuery = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    let user = userQuery.rows[0]; // Postgres returns matching arrays inside a .rows object
    
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

    // 3. Generate your stateless SleekOps Session JWT
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
    console.error('[Auth Bridge Error]:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Google Authentication validation failed.',
      detail: error.message
    });
  }
});

module.exports = router;