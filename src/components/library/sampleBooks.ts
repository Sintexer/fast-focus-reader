import type { Book } from '../../utils/db';

// Sample texts for testing - converted to paragraphs structure
const SAMPLE_TEXT_1_PARAGRAPHS = [
  [`The quick brown fox jumps over the lazy dog.`, `This is a sample text for testing the RSVP reader.`, `Each word appears one at a time, centered on the screen.`, `The middle vowel of each word is highlighted in a theme color.`, `You can control the reading speed with the WPM slider.`]
];

const SAMPLE_TEXT_2_PARAGRAPHS = [
  ["Mr. Hale checked his watch.", `"It's 3.14 minutes past midnight," he said, half-joking; then he frowned.`],
  [`"3.14 minutes?" I asked.`, `"Are you serious—or are you trying to scare me?"`],
  [`"No," Mr. Hale replied, "I'm trying to be precise…`,` and you're interrupting."`, `He tapped the page—twice—and whispered, "Listen: if you hear a click, don't move."`],
  [`I laughed.`, `"Don't move?`,`In this house?!"`],
  [`"Exactly."`, `He paused.`, `"Because if it clicks—if it clicks—then we're out of time."`],
  [`From the hallway came a soft sound: click.`, `"Was that it?" I said.`],
  [`Mr. Hale didn't answer.`, `He just looked at me, eyes wide, and muttered, "Oh."`, `Then, very quietly: "Run."`]
];

const SAMPLE_TEXT_3_PARAGRAPHS = [
  [`The journey begins with a single step!`, `Is it true?`, `Adventure awaits those who dare to explore.`]
];

export function createSampleBooks(): Book[] {
  const book1: Book = {
    id: 'sample-1',
    title: 'Sample Book',
    language: 'en',
    structure: {
      volumes: [
        {
          id: 'vol-1',
          title: '',
          chapters: [
            {
              id: 'ch-1',
              title: 'Chapter 1',
              paragraphs: SAMPLE_TEXT_1_PARAGRAPHS,
            },
          ],
        },
      ],
    },
    createdAt: Date.now(),
    lastReadAt: 0,
  };

  const book2: Book = {
    id: 'sample-2',
    title: 'Space Explorers',
    author: 'Test Author',
    language: 'en',
    structure: {
      volumes: [
        {
          id: 'vol-1',
          title: '',
          chapters: [
            {
              id: 'ch-1',
              title: 'Discovery2',
              paragraphs: SAMPLE_TEXT_2_PARAGRAPHS,
            },
          ],
        },
      ],
    },
    createdAt: Date.now(),
    lastReadAt: 0,
  };

  const book3: Book = {
    id: 'sample-3',
    title: 'The Great Adventure',
    author: 'Epic Writer',
    language: 'en',
    structure: {
      volumes: [
        {
          id: 'vol-1',
          title: 'Volume I: The Beginning',
          chapters: [
            {
              id: 'ch-1',
              title: 'Chapter 1: The Call',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-2',
              title: 'Chapter 2: The Journey Starts',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-3',
              title: 'Chapter 3: First Challenges',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-4',
              title: 'Chapter 4: New Allies',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-5',
              title: 'Chapter 5: The First Victory',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
          ],
        },
        {
          id: 'vol-2',
          title: 'Volume II: The Middle',
          chapters: [
            {
              id: 'ch-6',
              title: 'Chapter 6: Deeper Into the Unknown',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-7',
              title: 'Chapter 7: Trials and Tribulations',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-8',
              title: 'Chapter 8: The Darkest Hour',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-9',
              title: 'Chapter 9: A Glimmer of Hope',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-10',
              title: 'Chapter 10: Rising from the Ashes',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
          ],
        },
        {
          id: 'vol-3',
          title: 'Volume III: The End',
          chapters: [
            {
              id: 'ch-11',
              title: 'Chapter 11: The Final Battle',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-12',
              title: 'Chapter 12: Resolution',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
            {
              id: 'ch-13',
              title: 'Chapter 13: New Beginnings',
              paragraphs: SAMPLE_TEXT_3_PARAGRAPHS,
            },
          ],
        },
      ],
    },
    createdAt: Date.now(),
    lastReadAt: 0,
  };

  return [book1, book2, book3];
}
