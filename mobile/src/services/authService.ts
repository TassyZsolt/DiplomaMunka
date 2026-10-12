import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import {doc, setDoc} from 'firebase/firestore'

// Regisztráció
export const registerUser = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ Sikeres regisztráció:', user.email);

    // Felhasználó mentése Firestore-ba
    console.log("Mentés indul dbbe!");
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      firstName,
      lastName,
      createdAt: new Date(),
    });
    console.log("Mentés done")

    return user;
  } catch (error: any) {
    console.error('❌ Hiba regisztrációkor:', error.message);
    throw error;
  }
};

// Bejelentkezés
export const loginUser = async (email: string, password: string) => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Sikeres bejelentkezés:', user.email);
    return user;
  } catch (error: any) {
    console.error('❌ Hiba bejelentkezéskor:', error.message);
    throw error;
  }
};

// Jelszó visszaállítása
export const resetPassword = async (email: string) => {
  try {
    const { sendPasswordResetEmail } = await import('firebase/auth');
    await sendPasswordResetEmail(auth, email);
    console.log('✅ Jelszó-visszaállító email elküldve:', email);
  } catch (error: any) {
    console.error('❌ Hiba jelszó visszaállításakor:', error.message);
    throw error;
  }
};

