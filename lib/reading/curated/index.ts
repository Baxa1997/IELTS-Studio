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
import { BIRDSONG_DIALECTS } from "./p11-birdsong-dialects";
import { ASH_CLOUD } from "./p12-ash-cloud";
import { SCREW_THREAD } from "./p13-screw-thread";
import { ANAESTHESIA } from "./p14-anaesthesia";
import { BIRCH_TAR } from "./p15-birch-tar";
import { TIDE_MILLS } from "./p16-tide-mills";
import { ROMAN_ROADS } from "./p17-roman-roads";
import { OVERBOOKING } from "./p18-overbooking";
import { HALF_BRAIN_SLEEP } from "./p19-half-brain-sleep";
import { DEEP_TIME } from "./p20-deep-time";
import { FIREWORKS } from "./p21-fireworks";
import { ORPHAN_DRUGS } from "./p22-orphan-drugs";
import { DYNAMIC_PRICING } from "./p23-dynamic-pricing";
import { DENTAL_CALCULUS } from "./p24-dental-calculus";
import { SCHOOL_BELL } from "./p25-school-bell";
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
import { TEST_11 } from "./tests/test-11";
import { TEST_12 } from "./tests/test-12";
import { TEST_13 } from "./tests/test-13";
import { TEST_14 } from "./tests/test-14";
import { TEST_15 } from "./tests/test-15";
import { TEST_16 } from "./tests/test-16";
import { TEST_17 } from "./tests/test-17";
import { TEST_18 } from "./tests/test-18";
import { TEST_19 } from "./tests/test-19";
import { TEST_20 } from "./tests/test-20";
import { TEST_21 } from "./tests/test-21";
import { TEST_22 } from "./tests/test-22";
import { TEST_23 } from "./tests/test-23";
import { TEST_24 } from "./tests/test-24";
import { TEST_25 } from "./tests/test-25";
import { TEST_26 } from "./tests/test-26";
import { TEST_27 } from "./tests/test-27";
import { TEST_28 } from "./tests/test-28";
import { TEST_29 } from "./tests/test-29";
import { TEST_30 } from "./tests/test-30";
import { TEST_31 } from "./tests/test-31";
import { TEST_32 } from "./tests/test-32";
import { TEST_33 } from "./tests/test-33";
import { TEST_34 } from "./tests/test-34";
import { TEST_35 } from "./tests/test-35";
import { TEST_36 } from "./tests/test-36";
import { TEST_37 } from "./tests/test-37";
import { TEST_38 } from "./tests/test-38";
import { TEST_39 } from "./tests/test-39";
import { TEST_40 } from "./tests/test-40";
import { TEST_41 } from "./tests/test-41";
import { TEST_42 } from "./tests/test-42";
import { TEST_43 } from "./tests/test-43";
import { TEST_44 } from "./tests/test-44";
import { TEST_45 } from "./tests/test-45";
import { TEST_46 } from "./tests/test-46";
import { TEST_47 } from "./tests/test-47";
import { TEST_48 } from "./tests/test-48";
import { TEST_49 } from "./tests/test-49";
import { TEST_50 } from "./tests/test-50";
import { TEST_51 } from "./tests/test-51";
import { TEST_52 } from "./tests/test-52";
import { TEST_53 } from "./tests/test-53";
import { TEST_54 } from "./tests/test-54";
import { TEST_55 } from "./tests/test-55";
import { TEST_56 } from "./tests/test-56";
import { TEST_57 } from "./tests/test-57";
import { TEST_58 } from "./tests/test-58";
import { TEST_59 } from "./tests/test-59";
import { TEST_60 } from "./tests/test-60";
import { TEST_61 } from "./tests/test-61";
import { TEST_62 } from "./tests/test-62";
import { TEST_63 } from "./tests/test-63";
import { TEST_64 } from "./tests/test-64";
import { TEST_65 } from "./tests/test-65";
import { TEST_66 } from "./tests/test-66";
import { TEST_67 } from "./tests/test-67";
import { TEST_68 } from "./tests/test-68";
import { TEST_69 } from "./tests/test-69";
import { TEST_70 } from "./tests/test-70";
import { TEST_71 } from "./tests/test-71";
import { TEST_72 } from "./tests/test-72";
import { TEST_73 } from "./tests/test-73";
import { TEST_74 } from "./tests/test-74";
import { TEST_75 } from "./tests/test-75";
import { TEST_76 } from "./tests/test-76";
import { TEST_77 } from "./tests/test-77";
import { TEST_78 } from "./tests/test-78";
import { TEST_79 } from "./tests/test-79";

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
  TEST_11,
  TEST_12,
  TEST_13,
  TEST_14,
  TEST_15,
  TEST_16,
  TEST_17,
  TEST_18,
  TEST_19,
  TEST_20,
  TEST_21,
  TEST_22,
  TEST_23,
  TEST_24,
  TEST_25,
  TEST_26,
  TEST_27,
  TEST_28,
  TEST_29,
  TEST_30,
  TEST_31,
  TEST_32,
  TEST_33,
  TEST_34,
  TEST_35,
  TEST_36,
  TEST_37,
  TEST_38,
  TEST_39,
  TEST_40,
  TEST_41,
  TEST_42,
  TEST_43,
  TEST_44,
  TEST_45,
  TEST_46,
  TEST_47,
  TEST_48,
  TEST_49,
  TEST_50,
  TEST_51,
  TEST_52,
  TEST_53,
  TEST_54,
  TEST_55,
  TEST_56,
  TEST_57,
  TEST_58,
  TEST_59,
  TEST_60,
  TEST_61,
  TEST_62,
  TEST_63,
  TEST_64,
  TEST_65,
  TEST_66,
  TEST_67,
  TEST_68,
  TEST_69,
  TEST_70,
  TEST_71,
  TEST_72,
  TEST_73,
  TEST_74,
  TEST_75,
  TEST_76,
  TEST_77,
  TEST_78,
  TEST_79,
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
  BIRDSONG_DIALECTS,
  ASH_CLOUD,
  SCREW_THREAD,
  ANAESTHESIA,
  BIRCH_TAR,
  TIDE_MILLS,
  ROMAN_ROADS,
  OVERBOOKING,
  HALF_BRAIN_SLEEP,
  DEEP_TIME,
  FIREWORKS,
  ORPHAN_DRUGS,
  DYNAMIC_PRICING,
  DENTAL_CALCULUS,
  SCHOOL_BELL,
];

export type { CuratedPassage, CuratedQuestion } from "./shared";
