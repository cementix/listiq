# Catalog providers

Listiq imports catalog data for noncommercial use. The app displays provider credits and links back to source records where available.

| Source | Import policy |
| --- | --- |
| TMDB | Default source for movies and series. Show the approved logo and attribution. Refresh cached data by ID from day 150 and expire it at day 180. [API terms](https://www.themoviedb.org/api-terms-of-use) · [Attribution requirements](https://developer.themoviedb.org/docs/faq) |
| RAWG | Default source for games. Keep an active backlink on pages using its data or images. Account-wide usage counts toward the provider's monthly allowance. [API plans](https://rawg.io/apidocs) · [API terms](https://rawg.io/tos_api) |
| MangaUpdates | Optional manga and manhwa metadata. Daily sync looks up five of each and stores metadata only. [API policy](https://api.mangaupdates.com/openapi.yaml) |
| Wikidata | Optional comics metadata. Daily sync looks up up to five entries and imports structured data under CC0. [Licensing](https://www.wikidata.org/wiki/Wikidata:Licensing) |
| Open Library | Optional book metadata. Enable daily API lookups only with permission and an application contact. Use the monthly dumps for bulk ingestion. [API guidelines](https://openlibrary.org/developers/api) · [Data dumps](https://openlibrary.org/developers/dumps) · [Licensing](https://openlibrary.org/developers/licensing) |
| AniList, Google Books, Comic Vine | Imports are disabled by default at both scheduling and HTTP request boundaries. Keep them disabled unless permission covers Listiq's persisted catalog. [AniList terms](https://docs.anilist.co/guide/terms-of-use) · [Google Books terms](https://developers.google.com/books/terms) · [Comic Vine terms](https://comicvine.gamespot.com/api/) |

## Daily sync settings

- `CATALOG_REPLACEMENTS_DAILY=true` enables MangaUpdates and Wikidata. Open Library also requires `OPEN_LIBRARY_CATALOG_PERMISSION_CONFIRMED=true` and `OPEN_LIBRARY_CONTACT`.
- MangaUpdates and Open Library imports omit cover art and publisher descriptions. MangaUpdates titles without artwork are excluded from Discover. Wikidata imports omit images.
- TMDB refreshes up to 50 stale titles per run. Expiry clears cached responses and derived metrics. For provider-owned titles sourced solely from TMDB, it also clears provider artwork, synopsis, release data, genres, and catalog score. Titles and user records are retained. Canonical fields on mixed-source and user-created titles are retained because their provenance can differ.
- Every HTTP attempt, including retries, counts toward a provider's 24-hour quota for that database. RAWG allows 250 attempts per database per window. Account for all environments and other clients when checking the provider's account-wide limit.

See the [operations guide](operations.md) for dispatch, monitoring, and recovery.
