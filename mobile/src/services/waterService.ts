import { db, auth } from '../../firebaseConfig';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

export const addWaterData = async (amountMl: number) => {
    const user = auth.currentUser;

    if (!user){
        throw new Error ("No user is currently logged in.");
    }

    const newEntry = {
        userId: user.uid,
        date: new Date().toISOString().split('T')[0],
        amountMl: amountMl,
        createdAt: new Date().toISOString(),
    }

    const waterDrank = collection(db, 'waterDrank');
    const docRef = await addDoc(waterDrank, newEntry);
    return docRef.id;
    
}

export const getWaterData = async () => {
    const user = auth.currentUser;
    const waterRef = collection(db, 'waterDrank');
    
    if (!user){
        throw new Error ("No user is currently logged in.");
    }

    const q = query(waterRef,
         where('userId', '==', user.uid),
        where('date', '==', new Date().toISOString())
    );

    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return logs;
 
}