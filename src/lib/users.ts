import { doc, getDoc, setDoc } from "firebase/firestore";

import { db } from "./firestore";
import type { UserProfile } from "@/types/user";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, "users", uid));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function setUserProfile(
  uid: string,
  profile: UserProfile,
): Promise<void> {
  await setDoc(doc(db, "users", uid), profile, { merge: true });
}
