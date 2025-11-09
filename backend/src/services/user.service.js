import { db } from "../config/firebase.config.js";


const userCollection = db.collection('users');


// get user by id
const getUserById = async (id) => {
    try {
        const userDoc = await userCollection.doc(id).get();
        return userDoc;
    } catch (error) {
        console.error("Error getting user by ID:", error);
        throw new Error("Error getting user by ID");
    }
}


export { getUserById };