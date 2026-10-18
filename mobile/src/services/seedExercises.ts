import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SEED_EXERCISES, ExerciseDoc } from './exerciseService';

/**
 * Seeding script a Firestore /exercises kollekció feltöltésére.
 * Bárhonnan meghívható, vagy önállóan futtatható.
 */
export async function seedExercises(): Promise<void> {
  console.log('Starting Firestore exercises seeding...');
  try {
    for (const item of SEED_EXERCISES) {
      const exerciseRef = doc(db, 'exercises', item.id);
      await setDoc(exerciseRef, item, { merge: true });
      console.log(`✓ Seeded: ${item.name} (${item.id})`);
    }
    console.log('Seeding complete! Check your Firestore console.');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

export default seedExercises;
