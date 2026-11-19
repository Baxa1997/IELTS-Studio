// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { translator } from "@/lib/i18n";
import { PRACTICE_CARD_SKILLS } from "@/lib/free-practice/links";
import { FREE_SKILLS } from "@/lib/free-practice/rotation";
import { LocaleProvider } from "@/shared/components/i18n/locale-provider";

import { SkillPracticeCard } from "./_components/practice-cards";
import { PracticePicks } from "./_components/practice-picks";

/**
 * Every free card on the landing page reaches its skill's whole list.
 *
 * Since the cards became picks (2026-10-17) the card itself opens ONE practice,
 * and for a month nothing on the landing page linked /practice/<skill> — the
 * site's most-visited pages, found only from search. Derived from FREE_SKILLS,
 * so a skill added there is held to this too.
 */

// No network in a test: the picks request fails and the generic cards stand,
// which is the state the link has to exist in as well.
// LocaleProvider reads the router; nothing here changes language.
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));
// next/link needs a mounted App Router; an <a> carries everything asserted here.
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.stubGlobal("fetch", () => Promise.reject(new Error("offline")));

const t = translator("en");
const label = t("free.allPractices");

function renderSection() {
  const cards = Object.fromEntries(PRACTICE_CARD_SKILLS.map((s) => [s, <SkillPracticeCard key={s} skill={s} t={t} />]));
  return render(
    <LocaleProvider initial="en">
      <PracticePicks cards={cards as never} moreLabel="More" />
    </LocaleProvider>,
  );
}

describe("landing practice cards: link to the full list", () => {
  it("each free skill has a 'See all practices' link to /practice/<skill>", () => {
    const { container } = renderSection();
    const all = [...container.querySelectorAll("a")].filter((a) => a.textContent?.includes(label));
    expect(all.map((a) => a.getAttribute("href")).sort()).toEqual(FREE_SKILLS.map((s) => `/practice/${s}`).sort());
  });

  // The headline's stretched ::after covers the whole card; without the lift
  // the link renders but every click lands on the headline's practice.
  it("sits above the card's stretched link", () => {
    const { container } = renderSection();
    const link = [...container.querySelectorAll("a")].find((a) => a.textContent?.includes(label))!;
    expect(link.style.position).toBe("relative");
    expect(Number(link.style.zIndex)).toBeGreaterThan(0);
  });
});
