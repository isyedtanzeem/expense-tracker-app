import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";

export async function testConnection() {
  const snap = await getDocs(collection(db, "expenses"));
  console.log("Firestore Connected. Documents:", snap.size);
}
