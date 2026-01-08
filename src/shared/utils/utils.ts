import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// ============================================================================
// Name Formatting
// ============================================================================

/**
 * Formats a full name to "FirstName L." format
 * @param fullName - The full name to format
 * @returns Formatted name or "Anonymous User" if empty
 */
export function formatName(fullName: string | undefined): string {
  if (!fullName) return "Anonymous User";

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];

  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

// ============================================================================
// Profanity Detection
// ============================================================================

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

/**
 * Checks if the given text contains profanity
 * @param text - The text to check
 * @returns true if profanity is detected, false otherwise
 */
export function containsProfanity(text: string): boolean {
  return matcher.hasMatch(text);
}
