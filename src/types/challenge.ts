export interface ChallengeQuestion {
  imagine: string;
  tier: number;
  name: string;
  desc: string;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  owner: string;
  likes: number;
  browses: number;
  createdAt: number;
  questions: ChallengeQuestion[];
}
