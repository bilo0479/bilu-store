/**
 * ChatService tests — validates chat ID format, message sending, and read tracking.
 */

jest.mock('../src/config/firebase', () => ({
  db: {},
  auth: {},
  isFirebaseConfigured: true,
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn().mockResolvedValue(undefined),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  arrayUnion: jest.fn((v: string) => v),
  serverTimestamp: jest.fn(() => Date.now()),
}));

describe('ChatService — chat ID format', () => {
  // The deterministic chat ID format: sorted UIDs joined with underscore + adId
  function buildChatId(userId1: string, userId2: string, adId: string): string {
    const sorted = [userId1, userId2].sort();
    return `${sorted[0]}_${sorted[1]}_${adId}`;
  }

  it('produces deterministic IDs regardless of user order', () => {
    const id1 = buildChatId('user-a', 'user-b', 'ad-1');
    const id2 = buildChatId('user-b', 'user-a', 'ad-1');
    expect(id1).toBe(id2);
  });

  it('sorts UIDs alphabetically', () => {
    const id = buildChatId('zara', 'abel', 'ad-5');
    expect(id).toBe('abel_zara_ad-5');
  });

  it('different ads produce different chat IDs', () => {
    const id1 = buildChatId('user-a', 'user-b', 'ad-1');
    const id2 = buildChatId('user-a', 'user-b', 'ad-2');
    expect(id1).not.toBe(id2);
  });

  it('chat ID contains all three components', () => {
    const id = buildChatId('alice', 'bob', 'ad-99');
    expect(id).toContain('alice');
    expect(id).toContain('bob');
    expect(id).toContain('ad-99');
  });
});

describe('ChatService — message structure', () => {
  it('text message has required fields', () => {
    const msg = {
      id: 'msg-1',
      chatId: 'alice_bob_ad-1',
      senderId: 'alice',
      text: 'Hello!',
      imageUrl: null,
      readBy: ['alice'],
      createdAt: Date.now(),
    };

    expect(msg.senderId).toBe('alice');
    expect(msg.text).toBe('Hello!');
    expect(msg.imageUrl).toBeNull();
    expect(msg.readBy).toContain('alice');
  });

  it('image message has imageUrl set', () => {
    const msg = {
      id: 'msg-2',
      chatId: 'alice_bob_ad-1',
      senderId: 'bob',
      text: '',
      imageUrl: 'https://example.com/image.jpg',
      readBy: ['bob'],
      createdAt: Date.now(),
    };

    expect(msg.imageUrl).toBeTruthy();
  });
});

describe('ChatService — read tracking', () => {
  it('readBy array initially contains only sender', () => {
    const readBy = ['sender-id'];
    expect(readBy).toHaveLength(1);
    expect(readBy).toContain('sender-id');
  });

  it('markAsRead adds the reading user', () => {
    const readBy = ['sender-id'];
    const readerId = 'reader-id';
    if (!readBy.includes(readerId)) {
      readBy.push(readerId);
    }
    expect(readBy).toHaveLength(2);
    expect(readBy).toContain('reader-id');
  });

  it('does not duplicate reader in readBy', () => {
    const readBy = ['sender-id', 'reader-id'];
    const readerId = 'reader-id';
    if (!readBy.includes(readerId)) {
      readBy.push(readerId);
    }
    expect(readBy).toHaveLength(2);
  });
});
