/**
 * The hand-written reading library: original passages in the IELTS Academic
 * format (CLAUDE.md §IP — the Cambridge books are a model for length, density and
 * question style, never for content).
 *
 * THIS FILE, NOT THE DATABASE, IS THE SOURCE OF TRUTH. The shared library lives
 * in one reserved organisation, and in August 2026 an org delete wiped every row
 * it held. scripts/seed-reading-curated.ts rebuilds the library from here, with
 * ids derived from each passage's key, so learners' copies still match after a
 * re-seed.
 */

import { CARRINGTON_EVENT } from "./p01-carrington-event";
import { TALL_TIMBER } from "./p02-tall-timber";
import { TIMBUKTU_MANUSCRIPTS } from "./p03-timbuktu-manuscripts";
import { WIND_SHIPPING } from "./p04-wind-shipping";
import { TARDIGRADES } from "./p05-tardigrades";
import { REPLICATION_CRISIS } from "./p06-replication-crisis";
import { DEEP_SEA_MINING } from "./p07-deep-sea-mining";
import { CAHOKIA } from "./p08-cahokia";
import { LANGUAGE_TECHNOLOGY } from "./p09-language-technology";
import { COOLING_CITIES } from "./p10-cooling-cities";
import type { CuratedPassage, CuratedTest } from "./shared";
import { TEST_01 } from "./tests/test-01";
import { TEST_02 } from "./tests/test-02";
import { TEST_03 } from "./tests/test-03";
import { TEST_04 } from "./tests/test-04";
import { TEST_05 } from "./tests/test-05";
import { TEST_06 } from "./tests/test-06";
import { TEST_07 } from "./tests/test-07";
import { TEST_08 } from "./tests/test-08";
import { TEST_09 } from "./tests/test-09";
import { TEST_10 } from "./tests/test-10";

/** Full three-passage library tests (13 + 13 + 14 questions). */
export const CURATED_READING_TESTS: CuratedTest[] = [
  TEST_01,
  TEST_02,
  TEST_03,
  TEST_04,
  TEST_05,
  TEST_06,
  TEST_07,
  TEST_08,
  TEST_09,
  TEST_10,
];

export const CURATED_READING_PASSAGES: CuratedPassage[] = [
  CARRINGTON_EVENT,
  TALL_TIMBER,
  TIMBUKTU_MANUSCRIPTS,
  WIND_SHIPPING,
  TARDIGRADES,
  REPLICATION_CRISIS,
  DEEP_SEA_MINING,
  CAHOKIA,
  LANGUAGE_TECHNOLOGY,
  COOLING_CITIES,
];

export type { CuratedPassage, CuratedQuestion } from "./shared";
