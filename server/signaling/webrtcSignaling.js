/**
 * WebRTC Signaling Handler for Voice & Screen Sharing
 * Relays SDP offers, answers, and ICE candidates between peers in the same room.
 */
export function registerWebRTCSignaling(io, socket) {
  // ── Voice WebRTC Signaling ─────────────────────────────────────────────────
  socket.on('webrtc-voice-offer', ({ targetUserId, offer, roomId }) => {
    socket.to(`room:${roomId}`).emit('webrtc-voice-offer', {
      callerId: socket.data.userId,
      callerUsername: socket.data.username,
      offer,
      targetUserId,
    });
  });

  socket.on('webrtc-voice-answer', ({ targetUserId, answer, roomId }) => {
    socket.to(`room:${roomId}`).emit('webrtc-voice-answer', {
      responderId: socket.data.userId,
      answer,
      targetUserId,
    });
  });

  socket.on('webrtc-voice-ice', ({ targetUserId, candidate, roomId }) => {
    socket.to(`room:${roomId}`).emit('webrtc-voice-ice', {
      senderId: socket.data.userId,
      candidate,
      targetUserId,
    });
  });

  socket.on('webrtc-voice-state', ({ roomId, isMuted, isDeafened, isSpeaking }) => {
    socket.to(`room:${roomId}`).emit('webrtc-voice-state-update', {
      userId: socket.data.userId,
      username: socket.data.username,
      isMuted,
      isDeafened,
      isSpeaking,
    });
  });

  // ── Screen Sharing WebRTC Signaling ────────────────────────────────────────
  socket.on('screen-share-start', ({ roomId }) => {
    socket.to(`room:${roomId}`).emit('screen-share-started', {
      sharerId: socket.data.userId,
      sharerUsername: socket.data.username,
    });
  });

  socket.on('screen-share-stop', ({ roomId }) => {
    socket.to(`room:${roomId}`).emit('screen-share-stopped', {
      sharerId: socket.data.userId,
    });
  });

  socket.on('screen-offer', ({ targetUserId, offer, roomId }) => {
    socket.to(`room:${roomId}`).emit('screen-offer', {
      sharerId: socket.data.userId,
      offer,
      targetUserId,
    });
  });

  socket.on('screen-answer', ({ targetUserId, answer, roomId }) => {
    socket.to(`room:${roomId}`).emit('screen-answer', {
      viewerId: socket.data.userId,
      answer,
      targetUserId,
    });
  });

  socket.on('screen-ice', ({ targetUserId, candidate, roomId }) => {
    socket.to(`room:${roomId}`).emit('screen-ice', {
      senderId: socket.data.userId,
      candidate,
      targetUserId,
    });
  });
}

export default registerWebRTCSignaling;

