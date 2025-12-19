// backend/routes/rooms.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const Room = require('../models/Room');
const TokenManager = require('../utils/TokenManager');

// Helper to extract token from Authorization header or raw token string
function extractToken(authHeaderOrToken) {
  if (!authHeaderOrToken) return null;
  if (typeof authHeaderOrToken !== 'string') return null;
  if (authHeaderOrToken.startsWith('Bearer ')) return authHeaderOrToken.slice(7);
  return authHeaderOrToken;
}

// generate a short alphanumeric invite code, length 7
function generateInviteCode(len = 7) {
  // generate random bytes and map to base64 then strip non-word characters
  return crypto
    .randomBytes(Math.ceil(len * 0.75))
    .toString('base64')
    .replace(/\W/g, '')
    .slice(0, len)
    .toUpperCase();
}

/**
 * POST /rooms
 * Body: { name?: string }
 * Creates a new room. Host is the authenticated user.
 */
router.post('/', async (req, res) => {
  try {
    const rawToken = extractToken(req.headers.authorization || req.body.token || req.query.token);
    if (!rawToken) return res.status(401).json({ error: 'Missing token' });

    let userId;
    try {
      userId = TokenManager.verifyToken(rawToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { name } = req.body;
    const room = new Room({
      name: name || 'Untitled Room',
      hostUserId: userId,
      participants: [] // filled when users join via socket or join endpoint
    });

    await room.save();
    return res.json({ success: true, roomId: room._id, room });
  } catch (err) {
    console.error('POST /rooms error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /rooms/:id/invite
 * Headers: Authorization: Bearer <token>
 * Body: { regenerate?: boolean, inviteTTL?: seconds }
 * Only host can create or view invite code for the room.
 * Returns { inviteCode, link, inviteExpiresAt }
 */
router.post('/:id/invite', async (req, res) => {
  try {
    const roomId = req.params.id;
    const { regenerate = false, inviteTTL } = req.body || {};

    const rawToken = extractToken(req.headers.authorization || req.body.token || req.query.token);
    if (!rawToken) return res.status(401).json({ error: 'Missing token' });

    let userId;
    try {
      userId = TokenManager.verifyToken(rawToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    if (room.hostUserId !== userId) {
      return res.status(403).json({ error: 'Only host can generate invite codes' });
    }

    // If regenerate requested, always create a new code
    if (regenerate || !room.inviteCode) {
      room.inviteCode = generateInviteCode(7);

      if (inviteTTL && Number(inviteTTL) > 0) {
        room.inviteExpiresAt = new Date(Date.now() + Number(inviteTTL) * 1000);
      } else {
        // clear expiry if not provided
        room.inviteExpiresAt = null;
      }

      await room.save();
    }

    const origin = (process.env.APP_ORIGIN || process.env.CLIENT_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
    // use editor route for links (you chose /editor/:roomId)
    const link = `${origin}/editor/${room._id}?invite=${encodeURIComponent(room.inviteCode)}`;

    return res.json({
      success: true,
      inviteCode: room.inviteCode,
      link,
      inviteExpiresAt: room.inviteExpiresAt || null
    });
  } catch (err) {
    console.error('POST /rooms/:id/invite error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * POST /rooms/join
 * Body: { inviteCode?: string, roomId?: string }
 * Auth required. Adds lightweight participant entry (without socketId).
 * Returns room metadata.
 */
router.post('/join', async (req, res) => {
  try {
    const rawToken = extractToken(req.headers.authorization || req.body.token || req.query.token);
    if (!rawToken) return res.status(401).json({ error: 'Missing token' });

    let userId;
    try {
      userId = TokenManager.verifyToken(rawToken);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { inviteCode, roomId } = req.body;
    let room = null;

    if (inviteCode) {
      room = await Room.findOne({ inviteCode });
    } else if (roomId) {
      room = await Room.findById(roomId);
    } else {
      return res.status(400).json({ error: 'Provide inviteCode or roomId' });
    }

    if (!room) return res.status(404).json({ error: 'Invalid invite or room not found' });

    // check invite expiry if present
    if (room.inviteExpiresAt && room.inviteExpiresAt instanceof Date) {
      if (room.inviteExpiresAt.getTime() < Date.now()) {
        return res.status(410).json({ error: 'Invite has expired' });
      }
    }

    // add participant if not exists (note: socketId will be set when socket connects)
    const already = room.participants.some(p => p.userId === String(userId));
    if (!already) {
      room.participants.push({
        userId: String(userId),
        // username not in token payload by current TokenManager, leave default
        socketId: null,
        online: false,
        lastActive: new Date()
      });
      await room.save();
    }

    // return minimal room metadata
    return res.json({
      success: true,
      room: {
        roomId: room._id,
        name: room.name,
        hostUserId: room.hostUserId,
        inviteCode: room.inviteCode || null,
        inviteExpiresAt: room.inviteExpiresAt || null
      }
    });
  } catch (err) {
    console.error('POST /rooms/join error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
