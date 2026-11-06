import test from 'node:test';
import assert from 'node:assert/strict';
import * as Y from 'yjs';
import { RoomManager } from '../server/rooms/roomManager.js';
import { db } from '../server/persistence/database.js';
import { yjsRelay } from '../server/services/yjsRelay.js';

test('Collab System: Room Creation & Access Control', async (t) => {
  const roomManager = new RoomManager();

  await t.test('creates private room with CF-XXXX-XXXX code and owner role', async () => {
    const room = await roomManager.createRoom({
      name: 'Alpha Team Room',
      description: 'Collaborative C# development',
      language: 'csharp',
      ownerId: 'usr_owner_1',
      ownerUsername: 'pranshusharma7',
    });

    assert.ok(room.id);
    assert.match(room.roomCode, /^CF-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    assert.equal(room.isPrivate, true);
    assert.equal(room.members.length, 1);
    assert.equal(room.members[0].role, 'owner');
    assert.equal(room.members[0].githubUsername, 'pranshusharma7');
    assert.ok(room.inviteToken);
  });

  await t.test('allows owner to join without token', async () => {
    const room = await roomManager.createRoom({
      name: 'Owner Room',
      language: 'python',
      ownerId: 'usr_owner_2',
      ownerUsername: 'coder_owner',
    });

    const res = await roomManager.joinRoom({
      roomIdentifier: room.roomCode,
      user: { id: 'usr_owner_2', username: 'coder_owner' },
    });

    assert.equal(res.success, true);
    assert.equal(res.member.role, 'owner');
  });

  await t.test('rejects non-member joining without invitation token', async () => {
    const room = await roomManager.createRoom({
      name: 'Secure Vault',
      language: 'javascript',
      ownerId: 'usr_owner_3',
      ownerUsername: 'alice',
    });

    const res = await roomManager.joinRoom({
      roomIdentifier: room.id,
      user: { id: 'usr_intruder', username: 'intruder' },
    });

    assert.equal(res.success, false);
    assert.match(res.error, /token is required/i);
  });

  await t.test('accepts guest joining with valid invitation token as editor', async () => {
    const room = await roomManager.createRoom({
      name: 'Pair Room',
      language: 'csharp',
      ownerId: 'usr_owner_4',
      ownerUsername: 'alice',
    });

    const res = await roomManager.joinRoom({
      roomIdentifier: room.roomCode,
      user: { id: 'usr_bob', username: 'bob' },
      token: room.inviteToken,
    });

    assert.equal(res.success, true);
    assert.equal(res.member.role, 'editor');
    assert.equal(res.room.members.length, 2);
  });

  await t.test('enforces role permissions: viewer cannot edit or run code', async () => {
    const room = await roomManager.createRoom({
      name: 'Role Test Room',
      language: 'cpp',
      ownerId: 'usr_owner_5',
      ownerUsername: 'alice',
    });

    // Add guest
    const guestJoin = await roomManager.joinRoom({
      roomIdentifier: room.id,
      user: { id: 'usr_guest', username: 'charlie' },
      token: room.inviteToken,
    });
    assert.equal(guestJoin.success, true);

    // Update guest role to viewer in database
    await db.updateMemberRole(room.id, 'usr_guest', 'viewer');

    const canEdit = await roomManager.checkPermission(room.id, 'usr_guest', 'edit_code');
    const canRun = await roomManager.checkPermission(room.id, 'usr_guest', 'run_code');
    const canManage = await roomManager.checkPermission(room.id, 'usr_guest', 'manage_members');

    assert.equal(canEdit, false);
    assert.equal(canRun, false);
    assert.equal(canManage, false);

    // Verify owner has all permissions
    assert.equal(await roomManager.checkPermission(room.id, 'usr_owner_5', 'edit_code'), true);
    assert.equal(await roomManager.checkPermission(room.id, 'usr_owner_5', 'run_code'), true);
    assert.equal(await roomManager.checkPermission(room.id, 'usr_owner_5', 'manage_members'), true);
  });

  await t.test('creates and retrieves document snapshots (time travel checkpoints)', async () => {
    const room = await roomManager.createRoom({
      name: 'Snapshot Test Room',
      language: 'python',
      ownerId: 'usr_owner_6',
      ownerUsername: 'dave',
    });

    const snapshot = {
      id: 'snap_test_1',
      roomId: room.id,
      name: 'v1.0 Milestone',
      createdAt: Date.now(),
      createdBy: 'dave',
      fileCount: 1,
      files: [
        { name: 'main.py', lang: 'python', code: 'print("Hello Snapshot")' },
      ],
    };

    await db.saveSnapshot(room.id, snapshot);

    const snapshots = await db.getSnapshots(room.id);
    assert.ok(snapshots.length >= 1);
    assert.equal(snapshots[0].name, 'v1.0 Milestone');
    assert.equal(snapshots[0].files[0].code, 'print("Hello Snapshot")');
  });

  await t.test('Yjs Relay stores and retrieves document sync updates', async () => {
    const roomId = 'test_yjs_room_' + Date.now();
    const fileId = 'main.py';

    // Create client Y.Doc and generate genuine Yjs binary update
    const clientDoc = new Y.Doc();
    const ytext = clientDoc.getText('code');
    ytext.insert(0, 'Console.WriteLine("Hello CRDT");');
    const updateBinary = Y.encodeStateAsUpdate(clientDoc);
    const updateBase64 = Buffer.from(updateBinary).toString('base64');

    // Handle update in relay
    await yjsRelay.handleDocUpdate(roomId, fileId, updateBase64, 'usr_tester');

    // Server should provide full sync state
    const syncBase64 = await yjsRelay.getDocSyncState(roomId, fileId);
    assert.ok(syncBase64);

    // Apply sync state to fresh target client doc
    const targetDoc = new Y.Doc();
    Y.applyUpdate(targetDoc, new Uint8Array(Buffer.from(syncBase64, 'base64')));
    assert.equal(targetDoc.getText('code').toString(), 'Console.WriteLine("Hello CRDT");');
  });
});
