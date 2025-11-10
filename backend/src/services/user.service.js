import { db } from "../config/firebase.config.js";


const userCollection = db.collection('users');



// get all user 
const getAllUsers = async () => {
    try {
        const usersSnapshot = await userCollection.get();
        return usersSnapshot.docs.map(doc => ({id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting all users:", error);
        throw new Error("Error getting all users");
    }
};

// get user by id
const getUserById = async (id) => {
    try {
        const userRef = userCollection.doc(id);
        const userSnapshot = await userRef.get();
        return userSnapshot;
    } catch (error) {
        console.error("Error getting user by ID:", error);
        throw new Error("Error getting user by ID");
    }
};

// update display name
const updateUserDisplayName = async (id, displayName) => {
    try {
        const userRef = userCollection.doc(id);
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            throw new Error("User not found");
        }
        await userRef.update({ displayName });
        const updatedUserDoc = await userRef.get();
        return updatedUserDoc;
    } catch (error) {
        console.error("Error updating user display name:", error);
        throw new Error("Error updating user display name");
    }
};

// delete user by id

const deleteUserById = async (id) => {
    try {
        const userRef = userCollection.doc(id);
        const userSnapshot = await userRef.get();
        if (!userSnapshot.exists) {
            throw new Error("User not found");
        }
        await userRef.delete();
        return { message: "User deleted successfully" };
    } catch (error) {
        console.error("Error deleting user by ID:", error);
        throw new Error("Error deleting user by ID");
    }
};


export { updateUserDisplayName, getAllUsers, getUserById, deleteUserById };