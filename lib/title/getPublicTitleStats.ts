type TitleLibraryEntry = {
  rating: number | null;
  note: string | null;
  user: {
    libraryPublic: boolean;
    reviewsPublic: boolean;
  };
};

export function getPublicTitleStats(entries: TitleLibraryEntry[]) {
  const publicReviews = entries.filter((entry) => entry.user.reviewsPublic);
  const ratings = publicReviews
    .map((entry) => entry.rating)
    .filter((rating): rating is number => rating !== null);

  return {
    libraryCount: entries.filter((entry) => entry.user.libraryPublic).length,
    ratingCount: ratings.length,
    averageRating:
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : null,
    reviewCount: publicReviews.filter((entry) => entry.note).length,
  };
}
