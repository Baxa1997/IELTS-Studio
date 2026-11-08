import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FREE_SKILLS, isFreeSkill, type FreeSkill } from "@/lib/free-practice/rotation";
import { SOURCE_LOCALE } from "@/lib/i18n/locales";

import { FreePracticeView, practiceMetadata } from "./_components/practice-page";

/**
 * /practice/[skill] in English, at the bare URL. The page itself is
 * ./_components/practice-page; `/uz/…` and `/ru/…` render the same view for the
 * skills in LOCALISED_PRACTICE (app/[locale]/practice/[skill]).
 *
 * `dynamicParams = false` keeps any other segment, Speaking included, a real
 * 404: Speaking has no free practice, and its card on the landing page goes
 * straight to sign-in.
 */
export const dynamicParams = false;

export function generateStaticParams(): { skill: FreeSkill }[] {
  return FREE_SKILLS.map((skill) => ({ skill }));
}

export async function generateMetadata({ params }: { params: Promise<{ skill: string }> }): Promise<Metadata> {
  const { skill } = await params;
  if (!isFreeSkill(skill)) return {};
  return practiceMetadata(skill, SOURCE_LOCALE);
}

export default async function FreePracticePage({ params }: { params: Promise<{ skill: string }> }) {
  const { skill } = await params;
  if (!isFreeSkill(skill)) notFound();
  return <FreePracticeView skill={skill} locale={SOURCE_LOCALE} />;
}
