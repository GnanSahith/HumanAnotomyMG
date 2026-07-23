import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';

export const logActivity = async (userId, activityType, details) => {
    if (!userId) return;
    try {
        await addDoc(collection(db, 'users', userId, 'activityLogs'), {
            type: activityType,
            details: details,
            timestamp: serverTimestamp()
        });
    } catch (error) {
        console.error("Error logging activity: ", error);
    }
};

export const saveProgress = async (userId, path, state) => {
    if (!userId) return;
    try {
        await updateDoc(doc(db, 'users', userId), {
            lastPath: path,
            lastState: state,
            lastActive: serverTimestamp()
        });
    } catch (error) {
        console.error("Error saving progress: ", error);
    }
};
