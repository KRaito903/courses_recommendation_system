import { db } from "./config/firebase.config.js";

const testConnection = async () => {
  const testRef = db.collection("test").doc("ping");
  await testRef.set({ message: "Hello Firestore!" });
  console.log("Document written successfully ✅");

  const doc = await testRef.get();
  console.log("Data:", doc.data());
};

testConnection();