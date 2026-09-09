export interface User {
  id: string;
  name: string;
  email: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

interface Session {
  user: User;
  authenticated: true;
}

const USERS_KEY = 'facilityops.users';
const SESSION_KEY = 'facilityops.session';

const getStoredUsers = (): StoredUser[] => {
  const rawUsers = localStorage.getItem(USERS_KEY);
  if (!rawUsers) return [];

  try {
    const parsedUsers: unknown = JSON.parse(rawUsers);
    return Array.isArray(parsedUsers) ? (parsedUsers as StoredUser[]) : [];
  } catch {
    return [];
  }
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const hashPassword = async (password: string): Promise<string> => {
  const encodedPassword = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encodedPassword);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with this email already exists.');
  }

  const user: User = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
  };
  const storedUser: StoredUser = {
    ...user,
    passwordHash: await hashPassword(password),
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, storedUser]));
  return user;
};

export const loginUser = async (email: string, password: string, rememberMe: boolean): Promise<User> => {
  const normalizedEmail = normalizeEmail(email);
  const user = getStoredUsers().find((storedUser) => storedUser.email === normalizedEmail);

  if (!user || user.passwordHash !== await hashPassword(password)) {
    throw new Error('We could not sign you in with those credentials.');
  }

  const currentUser: User = { id: user.id, name: user.name, email: user.email };
  saveSession(currentUser, rememberMe);
  return currentUser;
};

export const logoutUser = (): void => {
  clearSession();
};

export const getCurrentUser = (): User | null => {
  const rawSession = sessionStorage.getItem(SESSION_KEY) ?? localStorage.getItem(SESSION_KEY);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as Session;
    return session.authenticated && session.user ? session.user : null;
  } catch {
    clearSession();
    return null;
  }
};

export const isAuthenticated = (): boolean => getCurrentUser() !== null;

export const saveSession = (user: User, rememberMe: boolean): void => {
  const session: Session = { user, authenticated: true };
  clearSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(SESSION_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
};

export const userExists = (email: string): boolean => {
  return getStoredUsers().some((user) => user.email === normalizeEmail(email));
};
