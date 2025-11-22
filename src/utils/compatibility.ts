import { Profile, CompatibilityScore, CompatibilityFactors } from '../types';

export function calculateCompatibilityScore(
  currentUser: Profile,
  targetUser: Profile
): CompatibilityScore {
  const factors: CompatibilityFactors = {
    age_similarity: calculateAgeSimilarity(currentUser.age, targetUser.age),
    location_proximity: calculateLocationProximity(
      currentUser.location,
      targetUser.location
    ),
    interest_overlap: 0.7,
    activity_level: 0.8,
    response_rate: 0.9,
  };

  const weights = {
    age_similarity: 0.15,
    location_proximity: 0.25,
    interest_overlap: 0.25,
    activity_level: 0.20,
    response_rate: 0.15,
  };

  const overall_score =
    factors.age_similarity * weights.age_similarity +
    factors.location_proximity * weights.location_proximity +
    factors.interest_overlap * weights.interest_overlap +
    factors.activity_level * weights.activity_level +
    factors.response_rate * weights.response_rate;

  const recommendation =
    overall_score >= 0.7 ? 'high' : overall_score >= 0.5 ? 'medium' : 'low';

  return {
    overall_score: Math.round(overall_score * 100),
    factors,
    recommendation,
  };
}

function calculateAgeSimilarity(age1: number | null, age2: number | null): number {
  if (!age1 || !age2) return 0.5;

  const ageDiff = Math.abs(age1 - age2);

  if (ageDiff <= 2) return 1.0;
  if (ageDiff <= 5) return 0.9;
  if (ageDiff <= 10) return 0.7;
  if (ageDiff <= 15) return 0.5;
  return 0.3;
}

function calculateLocationProximity(
  location1: string | null,
  location2: string | null
): number {
  if (!location1 || !location2) return 0.5;

  const loc1Parts = location1.toLowerCase().split(',');
  const loc2Parts = location2.toLowerCase().split(',');

  if (location1.toLowerCase() === location2.toLowerCase()) return 1.0;

  if (
    loc1Parts.length >= 2 &&
    loc2Parts.length >= 2 &&
    loc1Parts[1].trim() === loc2Parts[1].trim()
  ) {
    return 0.8;
  }

  return 0.4;
}

export function sortByCompatibility(
  currentUser: Profile,
  profiles: Profile[]
): Profile[] {
  return profiles
    .map((profile) => ({
      profile,
      score: calculateCompatibilityScore(currentUser, profile).overall_score,
    }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.profile);
}
