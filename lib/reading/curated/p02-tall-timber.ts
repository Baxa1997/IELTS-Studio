import { plain, type CuratedPassage, type CuratedQuestion } from "./shared";

function sentence(
  prompt: string,
  answer: string,
  supporting_sentence: string,
  explanation: string,
): CuratedQuestion {
  return {
    ...plain("sentence_completion", prompt, answer, supporting_sentence, explanation),
    word_limit: "ONE WORD ONLY",
  };
}

export const TALL_TIMBER: CuratedPassage = {
  key: "tall-timber-buildings",
  title: "Building Upwards with Wood",
  topic: "mass timber and the rise of wooden skyscrapers",
  difficulty: 5,
  body: `For most of the twentieth century, anyone planning a tall building chose between two materials: steel and reinforced concrete. Wood was for houses, barns and furniture, not for towers. That assumption is now being challenged. Around the world, architects are designing office blocks, apartments and even hotels with structures made mainly of timber, and some of these buildings are taller than twenty storeys. For many people the idea sounds surprising, even risky, so it is worth asking what has changed.

The answer lies in a group of engineered wood products known as mass timber. The most important is cross-laminated timber, usually shortened to CLT. It is made by gluing layers of wooden boards on top of each other, with the boards in each layer running at a right angle to those in the layer below. This arrangement makes the panels extremely stable, because wood that might bend or split in one direction is held firmly by the layers around it. A single CLT panel can be as long as a bus, and panels of this kind are strong enough to form walls and floors. Another product, glue-laminated timber, is used to make long, straight beams and columns.

Supporters of mass timber argue that its greatest advantage is environmental. Producing cement and steel requires enormous amounts of energy, and the cement industry alone is responsible for around eight per cent of global carbon dioxide emissions. Trees, by contrast, absorb carbon dioxide as they grow, and much of that carbon remains locked inside the wood for as long as the building stands. As long as forests are managed responsibly, with new trees planted to replace those that are cut down, building with timber can greatly reduce the carbon cost of construction. For this reason, several city governments have begun to encourage wooden buildings as part of their climate plans.

Speed is another benefit. Mass timber panels are manufactured in factories to exact measurements, with openings for windows, doors and cables already cut. They are then delivered to the site and lifted into position by crane, rather like the pieces of a giant construction kit. Because far less work takes place on site, construction can be significantly faster and quieter than with concrete, and fewer lorries are needed. For projects in crowded city centres, where noise and traffic lead to complaints from neighbours, this can be a deciding factor. Timber is also much lighter than concrete, so the foundations beneath a building can be smaller and cheaper.

The most common question about tall timber buildings concerns fire. It seems natural to assume that a wooden tower would burn more easily than one made of concrete. However, large timber panels behave very differently from the thin sticks used to light a fire. When a thick panel is exposed to flames, its outer surface turns to charcoal, and this layer of char protects the wood inside, slowing the rate at which the fire can spread. In fire tests, engineers have shown that thick panels can continue to support a building's weight for a long time. Most tall timber buildings also include sprinkler systems, and many cover the wood with fire-resistant boards.

Mass timber is not without its critics. Some forestry experts warn that rising demand could lead to more intensive logging if it is not carefully controlled. Wood must also be kept dry during construction, since moisture can cause panels to swell or decay. Timber floors can let more noise pass between apartments than concrete ones unless extra layers are added. In addition, building regulations in many countries were written with steel and concrete in mind, so the designers of timber towers often have to do extra work to prove that their buildings are safe before they receive permission.

Nevertheless, timber buildings keep getting taller. In 2022 a residential tower in the American city of Milwaukee, reaching 25 storeys, became the tallest building in the world with a structure made largely of mass timber, although it contains a concrete core and base. Several even taller projects have since been proposed in Europe, Asia and Australia. People who live and work in these buildings often say that the exposed wooden walls and ceilings make rooms feel warmer and calmer. Whether wood will ever replace concrete in the world's tallest skyscrapers is uncertain, but for buildings of moderate height it is increasingly seen as a serious alternative.`,
  questions: [
    plain(
      "true_false_not_given",
      "In CLT, each layer of boards runs at a right angle to the layer below it.",
      "TRUE",
      "It is made by gluing layers of wooden boards on top of each other, with the boards in each layer running at a right angle to those in the layer below.",
      "The passage describes exactly this crossed arrangement, which is what keeps the panels stable.",
    ),
    plain(
      "true_false_not_given",
      "Glue-laminated timber is more expensive to produce than cross-laminated timber.",
      "NOT GIVEN",
      "",
      "Both products are described, but their costs are never compared.",
    ),
    plain(
      "true_false_not_given",
      "The cement industry produces around eight per cent of the world's carbon dioxide emissions.",
      "TRUE",
      "Producing cement and steel requires enormous amounts of energy, and the cement industry alone is responsible for around eight per cent of global carbon dioxide emissions.",
      "'Global' matches 'the world's', and the figure is the same. Note the eight per cent is for cement alone, not cement and steel together.",
    ),
    plain(
      "true_false_not_given",
      "Mass timber panels are usually cut to size after they arrive at the building site.",
      "FALSE",
      "Mass timber panels are manufactured in factories to exact measurements, with openings for windows, doors and cables already cut.",
      "The panels arrive already made to exact measurements, so they are not cut to size on site.",
    ),
    plain(
      "true_false_not_given",
      "Few tall timber buildings are fitted with sprinklers.",
      "FALSE",
      "Most tall timber buildings also include sprinkler systems, and many cover the wood with fire-resistant boards.",
      "'Most' include sprinklers, which contradicts 'few'.",
    ),
    plain(
      "true_false_not_given",
      "Timber panels can be damaged if they get wet while a building is being constructed.",
      "TRUE",
      "Wood must also be kept dry during construction, since moisture can cause panels to swell or decay.",
      "Moisture can make panels 'swell or decay' — damage — during construction.",
    ),
    plain(
      "true_false_not_given",
      "The timber tower in Milwaukee was built without any concrete.",
      "FALSE",
      "In 2022 a residential tower in the American city of Milwaukee, reaching 25 storeys, became the tallest building in the world with a structure made largely of mass timber, although it contains a concrete core and base.",
      "It is made 'largely' of timber but 'contains a concrete core and base'. Watch for words like 'largely' that stop a statement being absolute.",
    ),
    sentence(
      "A single CLT panel can be as long as a ______.",
      "bus",
      "A single CLT panel can be as long as a bus, and panels of this kind are strong enough to form walls and floors.",
      "The passage compares a panel's length to a bus.",
    ),
    sentence(
      "Glue-laminated timber is used to make beams and ______.",
      "columns",
      "Another product, glue-laminated timber, is used to make long, straight beams and columns.",
      "Glue-laminated timber makes 'long, straight beams and columns'.",
    ),
    sentence(
      "Much of the carbon absorbed by trees stays in the wood for as long as the ______ stands.",
      "building",
      "Trees, by contrast, absorb carbon dioxide as they grow, and much of that carbon remains locked inside the wood for as long as the building stands.",
      "The carbon remains locked in 'for as long as the building stands'.",
    ),
    sentence(
      "Because timber is lighter than concrete, a building's ______ can be smaller.",
      "foundations",
      "Timber is also much lighter than concrete, so the foundations beneath a building can be smaller and cheaper.",
      "Lighter material means the 'foundations' can be smaller and cheaper. The answer is plural in the passage — spell it the same way.",
    ),
    sentence(
      "When a thick panel is exposed to flames, its outer surface turns to ______.",
      "charcoal",
      "When a thick panel is exposed to flames, its outer surface turns to charcoal, and this layer of char protects the wood inside, slowing the rate at which the fire can spread.",
      "The surface 'turns to charcoal'. 'Char' is used next, but 'charcoal' is the word that completes this sentence.",
    ),
    sentence(
      "Some forestry experts warn that rising demand for timber could lead to more intensive ______.",
      "logging",
      "Some forestry experts warn that rising demand could lead to more intensive logging if it is not carefully controlled.",
      "The concern is 'more intensive logging' if demand is not controlled.",
    ),
  ],
};
