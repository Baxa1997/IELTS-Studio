/**
 * Curated starter prompts — 14 Academic Task 1 (each with its figure) + 22 Task 2
 * (36 total), spread across bands 5–8 and topic families, so a new learner's
 * library isn't empty. Copied into each org once (see ./starter, source = 'seed').
 * All ORIGINAL content (no copyrighted test material); figures use clean, invented
 * data.
 */

import type { Figure } from "@/lib/writing/figure";
import type { Task2Category } from "./types";

export interface StarterPrompt {
  task_type: "task1_academic" | "task2";
  category: Task2Category | null;
  topic_family: string;
  difficulty: number;
  prompt_text: string;
  figure?: Figure;
}

const T1_TAIL =
  "Summarise the information by selecting and reporting the main features, and make comparisons where relevant.";

// ---- Academic Task 1 (chart description) -----------------------------------

const TASK1: StarterPrompt[] = [
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "transport",
    difficulty: 5,
    prompt_text: `The bar chart below shows the number of journeys, in millions, made by different modes of transport in the city of Greenford in 2022.\n\n${T1_TAIL}`,
    figure: {
      kind: "bar",
      title: "Journeys by mode of transport in Greenford, 2022",
      unit: "m",
      y_label: "Journeys (millions)",
      categories: ["Bus", "Train", "Car", "Bicycle", "Walking"],
      series: [{ name: "Journeys", values: [120, 95, 210, 45, 60] }],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "environment",
    difficulty: 6,
    prompt_text: `The line graph below shows the percentage of electricity generated from three sources in a European country between 2000 and 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "line",
      title: "Electricity generation by source, 2000–2020",
      unit: "%",
      x_label: "Year",
      y_label: "Share of generation (%)",
      categories: ["2000", "2005", "2010", "2015", "2020"],
      series: [
        { name: "Coal", values: [60, 52, 44, 33, 22] },
        { name: "Gas", values: [30, 33, 34, 34, 33] },
        { name: "Renewables", values: [10, 15, 22, 33, 45] },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "society",
    difficulty: 5,
    prompt_text: `The pie chart below shows how an average household in a country divided its monthly spending in 2021.\n\n${T1_TAIL}`,
    figure: {
      kind: "pie",
      title: "Average monthly household spending, 2021",
      unit: "%",
      slices: [
        { label: "Housing", value: 32 },
        { label: "Food", value: 22 },
        { label: "Transport", value: 14 },
        { label: "Leisure", value: 12 },
        { label: "Savings", value: 11 },
        { label: "Other", value: 9 },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "education",
    difficulty: 6,
    prompt_text: `The chart below compares the percentage of male and female graduates in five subjects at a university in 2022.\n\n${T1_TAIL}`,
    figure: {
      kind: "grouped_bar",
      title: "Graduates by subject and gender, 2022",
      unit: "%",
      x_label: "Subject",
      y_label: "Share of graduates (%)",
      categories: ["Engineering", "Medicine", "Law", "Business", "Arts"],
      series: [
        { name: "Male", values: [72, 48, 45, 55, 38] },
        { name: "Female", values: [28, 52, 55, 45, 62] },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "tourism",
    difficulty: 7,
    prompt_text: `The table below shows the number of international tourists, in millions, visiting four countries in 2010, 2015 and 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "table",
      title: "International tourist arrivals (millions)",
      unit: "m",
      columns: ["Country", "2010", "2015", "2020"],
      rows: [
        ["Spain", 53, 68, 19],
        ["France", 77, 84, 40],
        ["Italy", 44, 51, 25],
        ["Greece", 15, 23, 7],
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "society",
    difficulty: 6,
    prompt_text: `The line graph below shows the population of the town of Marisville between 1950 and 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "line",
      title: "Population of Marisville, 1950–2020",
      unit: "k",
      x_label: "Year",
      y_label: "Population (thousands)",
      categories: ["1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"],
      series: [{ name: "Population", values: [120, 180, 260, 340, 390, 420, 470, 540] }],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "family",
    difficulty: 7,
    prompt_text: `The chart below shows the average number of hours per week spent on housework by men and women in four countries in 2021.\n\n${T1_TAIL}`,
    figure: {
      kind: "grouped_bar",
      title: "Average weekly hours of housework, 2021",
      unit: "h",
      x_label: "Country",
      y_label: "Hours per week",
      categories: ["Japan", "UK", "Sweden", "Brazil"],
      series: [
        { name: "Men", values: [5, 9, 14, 7] },
        { name: "Women", values: [20, 17, 15, 22] },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "technology",
    difficulty: 8,
    prompt_text: `The line graph below shows the percentage of households with internet access in three regions of a country between 2005 and 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "line",
      title: "Households with internet access, 2005–2020",
      unit: "%",
      x_label: "Year",
      y_label: "Households with access (%)",
      categories: ["2005", "2010", "2015", "2020"],
      series: [
        { name: "North", values: [40, 62, 80, 93] },
        { name: "Central", values: [22, 45, 66, 85] },
        { name: "South", values: [8, 20, 42, 70] },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "environment",
    difficulty: 8,
    prompt_text: `The bar chart below shows the amount of waste recycled, in kilograms per person, in six countries in 2021.\n\n${T1_TAIL}`,
    figure: {
      kind: "bar",
      title: "Waste recycled per person, 2021",
      unit: "kg",
      y_label: "Recycled waste (kg per person)",
      categories: ["Germany", "S. Korea", "UK", "USA", "Mexico", "India"],
      series: [{ name: "Recycled", values: [300, 260, 180, 140, 70, 30] }],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "health",
    difficulty: 8,
    prompt_text: `The table below shows the percentage of adults in different age groups who met recommended exercise levels in 2010 and 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "table",
      title: "Adults meeting exercise guidelines (%)",
      unit: "%",
      columns: ["Age group", "2010", "2020"],
      rows: [
        ["18–29", 55, 62],
        ["30–44", 48, 57],
        ["45–59", 39, 50],
        ["60+", 28, 41],
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "business",
    difficulty: 5,
    prompt_text: `The bar chart below shows the number of cups of coffee sold each day of the week at a city café in one typical week.\n\n${T1_TAIL}`,
    figure: {
      kind: "bar",
      title: "Daily coffee sales at a city café",
      unit: "",
      y_label: "Cups sold",
      categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      series: [{ name: "Cups", values: [180, 175, 190, 210, 260, 320, 150] }],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "environment",
    difficulty: 6,
    prompt_text: `The pie chart below shows the share of total energy consumed by four sectors in a country in 2020.\n\n${T1_TAIL}`,
    figure: {
      kind: "pie",
      title: "Energy consumption by sector, 2020",
      unit: "%",
      slices: [
        { label: "Industry", value: 38 },
        { label: "Transport", value: 27 },
        { label: "Households", value: 24 },
        { label: "Services", value: 11 },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "leisure",
    difficulty: 7,
    prompt_text: `The chart below compares the average number of books read per year by three age groups, split by format, in 2022.\n\n${T1_TAIL}`,
    figure: {
      kind: "grouped_bar",
      title: "Books read per year by age group and format, 2022",
      unit: "",
      x_label: "Age group",
      y_label: "Books per year",
      categories: ["18–34", "35–54", "55+"],
      series: [
        { name: "Print", values: [6, 9, 14] },
        { name: "Digital", values: [11, 7, 3] },
      ],
    },
  },
  {
    task_type: "task1_academic",
    category: null,
    topic_family: "economy",
    difficulty: 7,
    prompt_text: `The line graph below shows the unemployment rate in two regions of a country between 2010 and 2022.\n\n${T1_TAIL}`,
    figure: {
      kind: "line",
      title: "Unemployment rate by region, 2010–2022",
      unit: "%",
      x_label: "Year",
      y_label: "Unemployment rate (%)",
      categories: ["2010", "2013", "2016", "2019", "2022"],
      series: [
        { name: "Northern region", values: [9.5, 8.1, 6.4, 5.2, 4.0] },
        { name: "Southern region", values: [12.0, 11.2, 10.5, 9.1, 7.8] },
      ],
    },
  },
];

// ---- Task 2 (argumentative essay) ------------------------------------------

const TASK2: StarterPrompt[] = [
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "technology",
    difficulty: 6,
    prompt_text:
      "Some people believe that smartphones have made face-to-face communication less common and damaged relationships. To what extent do you agree or disagree?",
  },
  {
    task_type: "task2",
    category: "discussion",
    topic_family: "education",
    difficulty: 7,
    prompt_text:
      "Some people think universities should focus only on academic subjects, while others believe they should prepare students for the job market. Discuss both views and give your own opinion.",
  },
  {
    task_type: "task2",
    category: "problem_solution",
    topic_family: "transport",
    difficulty: 6,
    prompt_text:
      "Many cities around the world suffer from heavy traffic congestion. What are the main causes of this problem, and what measures could be taken to solve it?",
  },
  {
    task_type: "task2",
    category: "two_part",
    topic_family: "work",
    difficulty: 7,
    prompt_text:
      "More people are choosing to work from home instead of in an office. Why has this become more common? What problems can it cause for workers and employers?",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "health",
    difficulty: 5,
    prompt_text:
      "Some people think that governments should make people responsible for their own health by placing a high tax on unhealthy food. To what extent do you agree or disagree?",
  },
  {
    task_type: "task2",
    category: "discussion",
    topic_family: "technology",
    difficulty: 8,
    prompt_text:
      "Some believe that the increasing use of artificial intelligence will mostly benefit society, while others worry it will do more harm than good. Discuss both views and give your own opinion.",
  },
  {
    task_type: "task2",
    category: "problem_solution",
    topic_family: "globalisation",
    difficulty: 7,
    prompt_text:
      "As global travel and trade become cheaper, many traditional cultures and languages are disappearing. What problems does this cause, and what could be done to address them?",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "government",
    difficulty: 6,
    prompt_text:
      "Some people think that public money should be spent on building new roads rather than on improving public transport. To what extent do you agree or disagree?",
  },
  {
    task_type: "task2",
    category: "two_part",
    topic_family: "media",
    difficulty: 6,
    prompt_text:
      "Children today spend many hours each day watching online videos. Why is this the case? Is it a positive or a negative development for children?",
  },
  {
    task_type: "task2",
    category: "discussion",
    topic_family: "family",
    difficulty: 7,
    prompt_text:
      "Some people believe children should live with their parents until they finish their studies, while others think young people should become independent earlier. Discuss both views and give your own opinion.",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "environment",
    difficulty: 6,
    prompt_text:
      "Some people argue that individuals can do little to reduce climate change and that it is the responsibility of governments and large companies. To what extent do you agree or disagree?",
  },
  {
    task_type: "task2",
    category: "problem_solution",
    topic_family: "education",
    difficulty: 6,
    prompt_text:
      "In many countries, the number of students leaving school without basic reading and writing skills is rising. What are the causes of this problem, and what solutions can you suggest?",
  },
  {
    task_type: "task2",
    category: "two_part",
    topic_family: "technology",
    difficulty: 7,
    prompt_text:
      "People today increasingly rely on online reviews before buying a product or service. Why has this become so common? Do the advantages of this trend outweigh the disadvantages?",
  },
  {
    task_type: "task2",
    category: "discussion",
    topic_family: "work",
    difficulty: 8,
    prompt_text:
      "Some people think a job that pays well is more important than job satisfaction, while others believe enjoying your work matters more than the salary. Discuss both views and give your own opinion.",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "culture",
    difficulty: 7,
    prompt_text:
      "Museums and historical sites are mainly visited by tourists rather than by local people. Why is this the case, and what could be done to encourage local residents to visit them?",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "health",
    difficulty: 6,
    prompt_text:
      "Many people now do most of their daily activities, such as shopping and working, without leaving home. Do the advantages of this development outweigh the disadvantages?",
  },
  {
    task_type: "task2",
    category: "discussion",
    topic_family: "environment",
    difficulty: 7,
    prompt_text:
      "Some people think that protecting the environment should be the government's priority, while others believe economic growth is more important. Discuss both views and give your own opinion.",
  },
  {
    task_type: "task2",
    category: "problem_solution",
    topic_family: "society",
    difficulty: 7,
    prompt_text:
      "In many large cities, the gap between the richest and poorest residents is growing wider. What problems does this cause, and what measures could reduce the gap?",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "education",
    difficulty: 5,
    prompt_text:
      "Some people believe that children should start learning a foreign language at primary school rather than secondary school. To what extent do you agree or disagree?",
  },
  {
    task_type: "task2",
    category: "two_part",
    topic_family: "lifestyle",
    difficulty: 6,
    prompt_text:
      "Fewer young people today take part in regular physical exercise than in the past. Why might this be happening? What can be done to encourage young people to be more active?",
  },
  {
    task_type: "task2",
    category: "opinion",
    topic_family: "government",
    difficulty: 8,
    prompt_text:
      "Some people think that countries should produce all the food their population needs and import as little as possible. To what extent do you agree or disagree?",
  },
];

export const STARTER_PROMPTS: StarterPrompt[] = [...TASK1, ...TASK2];
