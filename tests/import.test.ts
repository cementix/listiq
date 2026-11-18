import assert from "node:assert/strict";
import { test } from "node:test";

import { normaliseRating, parseCsv, parseLibraryCsv } from "../lib/import/parseLibraryCsv";
import { scoreCandidate } from "../lib/import/matchImportRows";

test("CSV parser handles quotes, escaped quotes, commas and CRLF", () => {
  const rows = parseCsv('Name,Review\r\n"Crouching Tiger, Hidden Dragon","He said ""wow"""\r\n\r\nHeat,\n');
  assert.deepEqual(rows, [["Name", "Review"], ["Crouching Tiger, Hidden Dragon", 'He said "wow"'], ["Heat", ""]]);
});

test("Letterboxd exports are detected and 5-star ratings doubled", () => {
  const parsed = parseLibraryCsv("Date,Name,Year,Letterboxd URI,Rating\n2024-01-01,Heat,1995,https://boxd.it/x,4.5\n2024-01-02,Alien,1979,https://boxd.it/y,\n");
  assert.equal(parsed.source, "letterboxd");
  assert.equal(parsed.typeHint, "MOVIE");
  assert.deepEqual(parsed.rows, [
    { name: "Heat", year: 1995, rating: 9, note: null },
    { name: "Alien", year: 1979, rating: null, note: null },
  ]);
});

test("Goodreads exports map to books and treat 0 stars as unrated", () => {
  const parsed = parseLibraryCsv("Book Id,Title,Author,My Rating,Original Publication Year,My Review\n1,Dune,Frank Herbert,5,1965,Classic\n2,Emma,Jane Austen,0,1815,\n");
  assert.equal(parsed.source, "goodreads");
  assert.equal(parsed.typeHint, "BOOK");
  assert.deepEqual(parsed.rows.map((row) => [row.name, row.year, row.rating, row.note]), [["Dune", 1965, 10, "Classic"], ["Emma", 1815, null, null]]);
});

test("generic files infer the rating scale and drop duplicates and blank names", () => {
  const tenPoint = parseLibraryCsv("title,year,score\nPortal,2007,9.5\nPortal,2007,8\n,2010,7\n");
  assert.equal(tenPoint.source, "generic");
  assert.deepEqual(tenPoint.rows, [{ name: "Portal", year: 2007, rating: 9.5, note: null }]);
  assert.equal(tenPoint.skipped, 2);
  const fivePoint = parseLibraryCsv("title,rating\nPortal,4\nHalo,3.5\n");
  assert.deepEqual(fivePoint.rows.map((row) => row.rating), [8, 7]);
});

test("files without a title column import nothing", () => {
  const parsed = parseLibraryCsv("foo,bar\n1,2\n");
  assert.equal(parsed.rows.length, 0);
});

test("ratings round to half points and stay within 0.5–10", () => {
  assert.equal(normaliseRating("3.7", true), 7.5);
  assert.equal(normaliseRating("12", false), 10);
  assert.equal(normaliseRating("abc", false), null);
  assert.equal(normaliseRating("", true), null);
});

test("matching prefers the same year and media type and rejects distant years", () => {
  const row = { name: "Dune", year: 2021, rating: null, note: null };
  const film = scoreCandidate({ id: "a", type: "MOVIE", year: 2021, catalogScore: 80 }, row, "MOVIE");
  const book = scoreCandidate({ id: "b", type: "BOOK", year: 1965, catalogScore: 95 }, row, "MOVIE");
  const remake = scoreCandidate({ id: "c", type: "MOVIE", year: 2022, catalogScore: 50 }, row, "MOVIE");
  assert.equal(book, null);
  assert.ok(film !== null && remake !== null && film > remake);
});
