import { gapFill, mcq, noteLine, tfng, type CuratedPassage } from "./shared";

const SHELL_FLOW = {
  title: "What happens after the shell is fired",
  layout: "flowchart" as const,
  wordLimit: "ONE WORD ONLY",
};

export const FIREWORKS: CuratedPassage = {
  key: "fireworks",
  title: "Chemistry in the Dark",
  topic: "how a firework produces its colours, shapes and timing",
  difficulty: 5,
  body: `A firework has to do four things in a fixed order and in under ten seconds: leave the ground, reach a height, burst, and produce light of a particular colour in a particular pattern. Each of those is a separate mechanism, and the whole device is built around the fact that the person lighting it will be somewhere else when the interesting part happens.

An aerial firework is a shell, usually spherical, packed inside a tube called a mortar. Beneath the shell sits a lifting charge of black powder. When it is ignited, the gas produced has nowhere to go but up the tube, and the shell is thrown out at a speed that determines how high it will rise. Nothing about the flight is steered; the height is set by the quantity of powder and the length of the mortar, and the direction by how the mortar is planted.

The same ignition lights a time fuse on the shell, which burns while the shell rises and reaches the bursting charge at the top of the climb, when the shell has stopped ascending and is momentarily still. The burst therefore happens at a predictable height, and the shell's brief pause at the top is why the pattern opens as a sphere rather than as a smear.

What produces the light is a set of small pellets called stars, packed inside the shell around the bursting charge. A star is a compressed mixture of a fuel, an oxidiser to supply the oxygen the fuel needs, a binder to hold it together, and a compound of a metal that determines the colour. The bursting charge scatters the stars outwards and lights them, and each one then burns for a second or two as it flies.

The colour comes from the metal. Heating an atom lifts its electrons to a higher energy level, and when they fall back they emit light at a wavelength characteristic of that element. Strontium gives red, barium green, copper blue and sodium a strong yellow. The same principle is what allows astronomers to identify the elements in a star from its spectrum, and a firework is a very crude version of the same measurement performed for entertainment.

Blue is notoriously the hardest. The copper compounds that produce it are only stable across a narrow range of temperature: too cool and the light is weak, too hot and the compound breaks down and the colour washes out towards white. A firework maker judging a blue is working within a margin of a few hundred degrees, and a good deep blue remains the accepted test of a manufacturer's skill.

Sodium creates a different problem. Its yellow is extremely bright and is produced by a very common element, so any sodium contamination — from an impurity in a chemical, from handling, from the paper of the casing — will overwhelm a delicate colour. Blue stars must therefore be made with materials that have been purified beyond what the colour itself requires.

The shape of the burst is geometry. Stars glued to the inside of a spherical shell in a single layer open into a sphere; two layers give a ring within a sphere; a shell divided into compartments gives a burst that changes colour as successive layers ignite. Patterns such as hearts and letters are made by arranging the stars on a flat card inside a cylindrical shell, which is why they look correct from one direction and like a line from the side.

Almost none of this is new. Black powder was in use in China by the tenth century, the metal-salt colours were worked out in Europe during the nineteenth, and the aerial shell has had its present form since roughly the same period. What has changed is the firing: a modern display is triggered electrically from a computer, which lets a hundred shells be timed to a piece of music to within a tenth of a second, and which has removed the operator from the position — beside the mortars, with a portfire — that made the job so dangerous for so long.

The industry's recent problems are environmental rather than technical. The metals that make the colours do not disappear; they fall as particulates, and measurements after large displays show sharp short-lived spikes in air pollution downwind. Perchlorate oxidisers have been found in water near firing sites. The response has been substitution where possible, compressed-air launching to remove the lifting charge, and in a growing number of cities replacement of the display altogether by drones, which produce the pattern without the chemistry and, as everybody who has watched one notices, without the noise.`,
  questions: [
    tfng(
      "The path of a shell can be adjusted after it leaves the mortar.",
      "FALSE",
      "Nothing about the flight is steered; the height is set by the quantity of powder and the length of the mortar, and the direction by how the mortar is planted.",
      "'Nothing about the flight is steered'.",
    ),
    tfng(
      "The time fuse is lit separately from the lifting charge.",
      "FALSE",
      "The same ignition lights a time fuse on the shell, which burns while the shell rises and reaches the bursting charge at the top of the climb, when the shell has stopped ascending and is momentarily still.",
      "'The same ignition lights a time fuse'.",
    ),
    tfng(
      "The shell bursts while it is still rising quickly.",
      "FALSE",
      "The burst therefore happens at a predictable height, and the shell's brief pause at the top is why the pattern opens as a sphere rather than as a smear.",
      "It bursts during the pause at the top.",
    ),
    tfng(
      "Each star contains its own supply of oxygen.",
      "TRUE",
      "A star is a compressed mixture of a fuel, an oxidiser to supply the oxygen the fuel needs, a binder to hold it together, and a compound of a metal that determines the colour.",
      "It contains 'an oxidiser to supply the oxygen'.",
    ),
    tfng(
      "The same principle behind firework colour is used in astronomy.",
      "TRUE",
      "The same principle is what allows astronomers to identify the elements in a star from its spectrum, and a firework is a very crude version of the same measurement performed for entertainment.",
      "Astronomers use the same principle.",
    ),
    tfng(
      "Blue is difficult because the compounds are expensive.",
      "FALSE",
      "The copper compounds that produce it are only stable across a narrow range of temperature: too cool and the light is weak, too hot and the compound breaks down and the colour washes out towards white.",
      "The difficulty is the temperature range.",
    ),
    tfng(
      "Patterned shells look the same from every direction.",
      "FALSE",
      "Patterns such as hearts and letters are made by arranging the stars on a flat card inside a cylindrical shell, which is why they look correct from one direction and like a line from the side.",
      "From the side they look like a line.",
    ),
    noteLine(
      SHELL_FLOW,
      null,
      "A lifting charge of black ______ throws the shell from the mortar",
      "powder",
      "Beneath the shell sits a lifting charge of black powder.",
      "It is 'a lifting charge of black powder'.",
    ),
    noteLine(
      SHELL_FLOW,
      null,
      "A time ______ burns while the shell climbs",
      "fuse",
      "The same ignition lights a time fuse on the shell, which burns while the shell rises and reaches the bursting charge at the top of the climb, when the shell has stopped ascending and is momentarily still.",
      "'A time fuse … burns while the shell rises'.",
      { before: [{ text: "One ignition sets off the whole sequence:", indent: 0 }] },
    ),
    noteLine(
      SHELL_FLOW,
      null,
      "The bursting charge scatters and lights the ______",
      "stars",
      "The bursting charge scatters the stars outwards and lights them, and each one then burns for a second or two as it flies.",
      "It 'scatters the stars outwards and lights them'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "______ produces a red flame and barium a green one.",
      "Strontium",
      "Strontium gives red, barium green, copper blue and sodium a strong yellow.",
      "'Strontium gives red, barium green'.",
    ),
    gapFill(
      "sentence_completion",
      "NO MORE THAN TWO WORDS",
      "Contamination by ______ swamps any delicate colour with yellow.",
      "sodium",
      "Its yellow is extremely bright and is produced by a very common element, so any sodium contamination — from an impurity in a chemical, from handling, from the paper of the casing — will overwhelm a delicate colour.",
      "Sodium contamination overwhelms the colour.",
    ),
    mcq(
      "What determines the shape of a burst?",
      [
        "How the stars are arranged inside the shell",
        "The amount of bursting charge used",
        "The height at which the shell bursts",
        "The speed of the shell when it leaves the mortar",
      ],
      "How the stars are arranged inside the shell",
      "Stars glued to the inside of a spherical shell in a single layer open into a sphere; two layers give a ring within a sphere; a shell divided into compartments gives a burst that changes colour as successive layers ignite.",
      "The arrangement inside the shell sets the shape.",
    ),
    mcq(
      "What has prompted some cities to use drones instead?",
      [
        "Pollution from the metals and oxidisers",
        "The cost of skilled firework makers",
        "The difficulty of producing blue",
        "Restrictions on the height of displays",
      ],
      "Pollution from the metals and oxidisers",
      "The metals that make the colours do not disappear; they fall as particulates, and measurements after large displays show sharp short-lived spikes in air pollution downwind.",
      "The metals fall as particulates and spike pollution.",
    ),
  ],
};
