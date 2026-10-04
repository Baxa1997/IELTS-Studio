import { ImageResponse } from "next/og";

import { SKILL_COVER_CATEGORY } from "@/app/_landing/_lib/design";
import { OG_COVER, OG_INK } from "@/app/_landing/_lib/og-palette";
import { FREE_PAGE_TITLE, freePracticePage } from "@/lib/free-practice/links";
import { FREE_SKILLS, isFreeSkill } from "@/lib/free-practice/rotation";
import { en } from "@/lib/i18n/messages/en";
import { absoluteUrl } from "@/lib/seo";

/**
 * The card a shared free-practice link unfurls into — on Telegram above all,
 * where this audience passes links around. The generic site preview says
 * "EngProgress" over every page; this says what the link IS ("Free IELTS
 * Reading practice") and that it costs nothing and needs no account, which is
 * the whole reason to tap it.
 *
 * The skill's own cover colours — the same map the practice cards use
 * (SKILL_COVER_CATEGORY), through the share card's hex palette. Static: one
 * card per skill, drawn once.
 *
 * ⚠️ SATORI, NOT A BROWSER — see the note on the blog's card beside the
 * article page: flex only, no `var()`, no grid.
 */

export const alt = "Free daily practice on EngProgress";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams(): { skill: string }[] {
  return FREE_SKILLS.map((skill) => ({ skill }));
}

export default async function Image({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isFreeSkill(skill)) return new Response("Not found", { status: 404 });
  const { a, b } = OG_COVER[SKILL_COVER_CATEGORY[skill]];
  const host = absoluteUrl(freePracticePage(skill)).replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          backgroundImage: `linear-gradient(135deg, ${a} 0%, ${b} 100%)`,
          color: OG_INK.text,
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -170,
            right: -130,
            width: 560,
            height: 560,
            borderRadius: 9999,
            border: `2px solid ${OG_INK.ring}`,
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 14,
                backgroundColor: OG_INK.mark,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              E
            </div>
            <div style={{ display: "flex", marginLeft: 16, fontSize: 34, fontWeight: 700 }}>EngProgress</div>
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              padding: "10px 22px",
              borderRadius: 9999,
              border: `2px solid ${OG_INK.line}`,
            }}
          >
            {en["free.freeToday"]}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", maxWidth: 1020, fontSize: 72, fontWeight: 700, lineHeight: 1.1, letterSpacing: -1 }}>
            {en[FREE_PAGE_TITLE[skill]]}
          </div>
          <div style={{ display: "flex", marginTop: 22, fontSize: 32, color: OG_INK.soft }}>
            {en["free.eyebrow"]} · {en["free.ogNoAccount"]}
          </div>
        </div>

        <div style={{ display: "flex", fontSize: 26, color: OG_INK.soft }}>{host}</div>
      </div>
    ),
    { ...size },
  );
}
