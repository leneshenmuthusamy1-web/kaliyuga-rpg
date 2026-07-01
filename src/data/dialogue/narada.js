// Narada Muni at the Forest Road crossroads. Revisitable — each visit after the first
// opens a fresh lore topic. Five total conversations reward the Saptarishi Star-Map.

export const naradaDialogue = {
  start: 'router',
  nodes: {
    router: {
      speaker: 'Narada Muni',
      line: (state) =>
        state.hasFlag('narada_met')
          ? 'Narayana, Narayana! Back again. Good — I collect returning listeners the way other beings collect grievances.'
          : "Narayana, Narayana! A traveler with fire in his hands and grief in his eyes. I've been told to expect you, and I do so love being right.",
      options: [
        {
          tag: 'HONEST',
          text: '[HONEST] I don\'t know if I\'m the man you were told about.',
          next: 'honest_intro',
          effects: { presence: 5, setFlag: 'narada_met' },
        },
        {
          tag: 'TACTICAL',
          text: '[TACTICAL] Tell me something useful.',
          next: 'topic_boon',
          effects: { setFlag: 'narada_met' },
        },
        {
          tag: 'DEFLECT',
          text: '[DEFLECT] I don\'t have time for riddles.',
          next: 'deflect',
          effects: { setFlag: 'narada_met' },
        },
      ],
    },
    honest_intro: {
      speaker: 'Narada Muni',
      line: '"Both, probably" — that would be the honest man\'s answer, and you didn\'t even need to say it aloud for me to hear it. Rare, that. I\'ve met exactly enough people to know how rare.',
      options: [
        {
          tag: 'NEUTRAL',
          text: '[Continue]',
          next: 'topic_boon',
          effects: { unlockLore: 'lore_narada' },
        },
      ],
    },
    deflect: {
      speaker: 'Narada Muni',
      line: 'No one ever does, and yet the riddles keep being the fastest way through. Very well — plainly, then, this once.',
      options: [
        {
          tag: 'NEUTRAL',
          text: '[Continue]',
          next: 'topic_boon',
        },
      ],
    },
    topic_boon: {
      speaker: 'Narada Muni',
      line: 'Mahisha-Vritra holds his throne behind a boon: no power originating in Dharma may end him. Airtight, cosmologically speaking. The void that granted it never accounted for a mortal so emptied of faith that his grief sits outside the category entirely. It forgot to account for pain. Interesting oversight, for something older than the three worlds.',
      options: [
        {
          tag: 'NEUTRAL',
          text: '[Continue]',
          next: 'topic_end',
          effects: { unlockLore: 'lore_boon' },
        },
      ],
    },
    topic_end: {
      speaker: 'Narada Muni',
      line: 'Come back and speak with me again, when the road brings you back this way. I am, as ever, exactly where something interesting is about to happen.',
      options: [],
    },
  },
};
