import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

const PEOPLE = [
  "Marta Lindqvist",
  "Jens Møller",
  "Tomás Ferreira",
  "Hiroshi Tanaka",
  "Amara Okafor",
];

function person(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("matching_features", prompt, answer, supporting_sentence, explanation),
    options: PEOPLE,
  };
}

const WORD_BANK = [
  "oil",
  "coal",
  "pressure",
  "temperature",
  "aircraft",
  "bird",
  "computers",
  "sailors",
  "expensive",
  "small",
];

function bank(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("summary_completion", prompt, answer, supporting_sentence, explanation),
    options: WORD_BANK,
  };
}

const REASONS_STEM =
  "Which TWO of the following are given as reasons for the renewed interest in wind power at sea?";
const REASONS_OPTIONS = [
  "stricter international targets for cutting emissions",
  "a sharp fall in the cost of building new ships",
  "the rising cost of fuel and of emitting carbon",
  "a shortage of engineers trained to maintain engines",
  "demands from passengers on cruise ships",
];

function reason(supporting_sentence: string, explanation: string): CuratedQuestion {
  return {
    ...plain("multiple_choice", REASONS_STEM, "A or C", supporting_sentence, explanation),
    options: REASONS_OPTIONS,
  };
}

export const WIND_SHIPPING: CuratedPassage = {
  key: "wind-assisted-shipping",
  title: "Sails Return to the Shipping Lanes",
  topic: "wind power and the race to cut shipping emissions",
  difficulty: 7,
  body: `For thousands of years, the wind carried the world's trade. Then, in the nineteenth century, coal-fired steam engines freed ships from the weather, and within a few decades commercial sailing vessels had all but disappeared. Today, the sail is making an unexpected return. On a small but growing number of cargo ships, tall spinning cylinders and rigid wing-shaped structures now stand above the deck, reducing the amount of fuel that the engines burn.

The reason is not nostalgia but climate policy. Shipping carries around four-fifths of global trade by volume and produces close to three per cent of the world's greenhouse gas emissions. In 2023 the International Maritime Organization, which regulates global shipping, set a goal of reaching net-zero emissions from the industry by around 2050. At the same time, higher fuel prices and new charges on carbon emissions in some regions have made every tonne of fuel saved more valuable. Because a large ship can remain in service for twenty-five years or more, owners are under pressure to find solutions that work for vessels already at sea, not only for those still to be built.

The most common modern design has surprisingly old roots. In the 1920s the German engineer Anton Flettner built a ship driven by two large rotating cylinders. The design worked, but fuel oil was cheap and plentiful, and the idea was soon forgotten. Modern rotor sails follow the same principle. When wind blows across a spinning cylinder, the air moves faster on one side than the other, creating a difference in pressure that pushes the cylinder, and the ship, forward. Wing sails, by contrast, are rigid structures shaped like an aircraft wing standing on its end. In both cases, the sails are adjusted automatically by computers that respond to changes in the wind, so no extra crew are needed.

How much fuel such systems save is a matter of debate. Marta Lindqvist, a naval architect who has tested several designs, points out that published figures range from under five per cent to more than twenty per cent, and argues that the variation is largely explained by where a ship sails. 'On a windy ocean crossing a rotor can do a great deal of the work,' she says, 'but on a calm route it may contribute very little.' Some of the largest reported savings have come from ships that combine sails with software that plans voyages around favourable winds.

Captains have had to adapt. Jens Møller, who commands a bulk carrier fitted with four rotors, admits that his crew were initially suspicious of equipment that seemed to belong to another age. Their attitude changed, he says, once they saw the daily fuel reports. Planning a voyage now involves studying wind forecasts as carefully as fuel prices, and a slightly longer route can sometimes be cheaper if it offers stronger winds.

Obstacles remain. Fitting sails to an existing vessel is costly, and many owners hesitate to spend money on equipment whose benefits depend on the weather. Tomás Ferreira, a shipping economist, identifies a further difficulty in the way the industry is organised. Many ships are not operated by the companies that own them but hired out to others, and it is usually the company hiring the ship that pays for its fuel. As a result, an owner who invests in sails may see most of the savings go to someone else. Ports present practical challenges too. According to Hiroshi Tanaka, who manages a container terminal, tall rotors can get in the way of the cranes that load and unload ships, which is why some newer designs can be folded down or tilted when a vessel is in port.

Few experts believe that sails alone will decarbonise shipping. Amara Okafor, who studies climate policy for the maritime sector, stresses that ships will still need new low-carbon fuels such as green ammonia or methanol, which are likely to be expensive and in short supply for years. In her view, the real value of wind power lies in reducing how much of those scarce fuels each voyage requires. Still, fewer than a hundred of the world's more than 100,000 merchant ships were equipped with wind-assist technology by the mid-2020s. Whether sails become a normal sight on the oceans again will depend less on engineering than on money, regulation and the willingness of a cautious industry to change.`,
  questions: [
    person(
      "An owner who pays for the equipment may not be the one who benefits from lower fuel bills.",
      "Tomás Ferreira",
      "As a result, an owner who invests in sails may see most of the savings go to someone else.",
      "Ferreira explains that the company hiring a ship usually pays for fuel, so the owner who buys sails may not get the savings.",
    ),
    person(
      "The amount of fuel saved depends mainly on the routes a ship travels.",
      "Marta Lindqvist",
      "Marta Lindqvist, a naval architect who has tested several designs, points out that published figures range from under five per cent to more than twenty per cent, and argues that the variation is largely explained by where a ship sails.",
      "Lindqvist says the variation is 'largely explained by where a ship sails' — windy crossings versus calm routes.",
    ),
    person(
      "Wind power could help limited supplies of low-carbon fuels go further.",
      "Amara Okafor",
      "In her view, the real value of wind power lies in reducing how much of those scarce fuels each voyage requires.",
      "Okafor says the value of sails is in reducing how much of the 'scarce fuels' each voyage needs.",
    ),
    person(
      "Some sailors were doubtful about the technology when it was first introduced.",
      "Jens Møller",
      "Jens Møller, who commands a bulk carrier fitted with four rotors, admits that his crew were initially suspicious of equipment that seemed to belong to another age.",
      "Møller's crew were 'initially suspicious' — 'doubtful at first'.",
    ),
    person(
      "Tall equipment on deck can interfere with the loading of cargo.",
      "Hiroshi Tanaka",
      "According to Hiroshi Tanaka, who manages a container terminal, tall rotors can get in the way of the cranes that load and unload ships, which is why some newer designs can be folded down or tilted when a vessel is in port.",
      "Tanaka says rotors 'get in the way of the cranes that load and unload ships'.",
    ),
    bank(
      "Although Flettner's rotor ship of the 1920s worked, cheap ______ meant the idea was abandoned.",
      "oil",
      "The design worked, but fuel oil was cheap and plentiful, and the idea was soon forgotten.",
      "Cheap 'fuel oil' killed the idea. 'Coal' is a trap: coal powered the earlier steam engines, not the 1920s ships.",
    ),
    bank(
      "When wind passes a spinning cylinder, a difference in ______ pushes the ship forward.",
      "pressure",
      "When wind blows across a spinning cylinder, the air moves faster on one side than the other, creating a difference in pressure that pushes the cylinder, and the ship, forward.",
      "The faster air on one side creates 'a difference in pressure'. Temperature is never mentioned.",
    ),
    bank(
      "Rigid wing sails resemble the wing of an ______ turned upright.",
      "aircraft",
      "Wing sails, by contrast, are rigid structures shaped like an aircraft wing standing on its end.",
      "They are 'shaped like an aircraft wing standing on its end' — 'turned upright'.",
    ),
    bank(
      "Both kinds of sail are controlled by ______, so no additional crew are required.",
      "computers",
      "In both cases, the sails are adjusted automatically by computers that respond to changes in the wind, so no extra crew are needed.",
      "The sails are adjusted 'by computers'. 'Sailors' is the trap — the passage says no extra crew are needed.",
    ),
    bank(
      "Adding sails to a ship already in service is ______, which makes many owners cautious.",
      "expensive",
      "Fitting sails to an existing vessel is costly, and many owners hesitate to spend money on equipment whose benefits depend on the weather.",
      "'Costly' is paraphrased by 'expensive'.",
    ),
    bank(
      "By the mid-2020s the number of merchant ships using wind power was still very ______.",
      "small",
      "Still, fewer than a hundred of the world's more than 100,000 merchant ships were equipped with wind-assist technology by the mid-2020s.",
      "Fewer than a hundred out of more than 100,000 is a very small number.",
    ),
    reason(
      "In 2023 the International Maritime Organization, which regulates global shipping, set a goal of reaching net-zero emissions from the industry by around 2050.",
      "A is correct: the IMO set a net-zero goal for shipping. B is wrong — the passage never says ships became cheaper to build.",
    ),
    reason(
      "At the same time, higher fuel prices and new charges on carbon emissions in some regions have made every tonne of fuel saved more valuable.",
      "C is correct: 'higher fuel prices and new charges on carbon emissions' make savings more valuable. D and E are not mentioned.",
    ),
  ],
};
