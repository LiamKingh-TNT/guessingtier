import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  type DocumentData,
  type QuerySnapshot,
} from "firebase/firestore";

import { db } from "./firestore";
import type { Challenge, ChallengeQuestion } from "@/types/challenge";

function mapChallengeDocs(
  snapshot: QuerySnapshot<DocumentData>,
): Challenge[] {
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Challenge, "id">),
  }));
}

export async function getAllChallenges(): Promise<Challenge[]> {
  const snapshot = await getDocs(collection(db, "challenges"));

  return mapChallengeDocs(snapshot);
}

export async function getChallengesByOwner(
  owner: string,
): Promise<Challenge[]> {
  const challengesQuery = query(
    collection(db, "challenges"),
    where("owner", "==", owner),
  );
  const snapshot = await getDocs(challengesQuery);

  return mapChallengeDocs(snapshot);
}

export async function getMostViewedChallenges(
  count = 5,
): Promise<Challenge[]> {
  const challengesQuery = query(
    collection(db, "challenges"),
    orderBy("browses", "desc"),
    limit(count),
  );
  const snapshot = await getDocs(challengesQuery);

  return mapChallengeDocs(snapshot);
}

export async function getMostPopularChallenges(
  count = 5,
): Promise<Challenge[]> {
  const challengesQuery = query(
    collection(db, "challenges"),
    orderBy("likes", "desc"),
    limit(count),
  );
  const snapshot = await getDocs(challengesQuery);

  return mapChallengeDocs(snapshot);
}

export async function getMostRecentChallenges(
  count = 5,
): Promise<Challenge[]> {
  const challengesQuery = query(
    collection(db, "challenges"),
    orderBy("createdAt", "desc"),
    limit(count),
  );
  const snapshot = await getDocs(challengesQuery);

  return mapChallengeDocs(snapshot);
}

export async function createChallenge(
  owner: string,
  title: string,
  description: string,
  questions: ChallengeQuestion[],
): Promise<string> {
  const docRef = await addDoc(collection(db, "challenges"), {
    title,
    description,
    owner,
    likes: 0,
    browses: 0,
    createdAt: Date.now(),
    questions,
  });

  return docRef.id;
}

export async function getChallengeById(
  id: string,
): Promise<Challenge | null> {
  const snapshot = await getDoc(doc(db, "challenges", id));
  if (!snapshot.exists()) {
    return null;
  }

  return { id: snapshot.id, ...(snapshot.data() as Omit<Challenge, "id">) };
}

export async function incrementBrowses(id: string): Promise<void> {
  await updateDoc(doc(db, "challenges", id), { browses: increment(1) });
}

export async function incrementLikes(id: string, delta = 1): Promise<void> {
  await updateDoc(doc(db, "challenges", id), { likes: increment(delta) });
}

export async function deleteChallenge(id: string): Promise<void> {
  await deleteDoc(doc(db, "challenges", id));
}
