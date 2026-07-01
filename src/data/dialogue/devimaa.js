// Ghost of Devimaa — tutorial guide in the Valley of Kalini. No combat; she orients
// the player, gestures toward the forge cache and the temple, and seeds the first
// lore unlocks.

export const devimaaDialogue = {
  start: 'greet',
  nodes: {
    greet: {
      speaker: 'Ghost of Devimaa',
      line: 'So. You came back. I did not think you would, after Kalini.',
      options: [
        {
          tag: 'HONEST',
          text: "[HONEST] I didn't think I would either.",
          next: 'honest_1',
          effects: { presence: 5 },
        },
        {
          tag: 'TACTICAL',
          text: '[TACTICAL] Tell me what happened here.',
          next: 'tactical_1',
        },
        {
          tag: 'DEFLECT',
          text: '[DEFLECT] Just point me to the temple.',
          next: 'deflect_1',
        },
      ],
    },
    honest_1: {
      speaker: 'Ghost of Devimaa',
      line: "Grief brought you here. Good. That's the only honest reason left. The Eclipse-Legion came for the village three nights after you left for the Eleven Rivers. There was nothing you could have done — I need you to hear that, not just agree with it.",
      options: [
        {
          tag: 'HONEST',
          text: '[HONEST] I don\'t believe that yet. But I heard you.',
          next: 'converge',
          effects: { presence: 5, unlockLore: 'lore_eclipse_legion' },
        },
      ],
    },
    tactical_1: {
      speaker: 'Ghost of Devimaa',
      line: 'The Eclipse-Legion came three nights after you left. Their drums are carved from the bones of fallen Devas — you will hear them again before this is over. Their doctrine is that massacre is liturgy. Remember that when you meet them.',
      options: [
        {
          tag: 'TACTICAL',
          text: '[TACTICAL] Understood. What do I need to know to move forward?',
          next: 'converge',
          effects: { unlockLore: 'lore_eclipse_legion' },
        },
      ],
    },
    deflect_1: {
      speaker: 'Ghost of Devimaa',
      line: 'Still doing that. Very well — the temple is past the forge, up the ash-slope. But Vikram: a man who will not look at the fire behind him walks toward the one in front of him differently. Weaker. Be careful.',
      options: [
        {
          tag: 'DEFLECT',
          text: '[DEFLECT] Noted.',
          next: 'converge',
        },
      ],
    },
    converge: {
      speaker: 'Ghost of Devimaa',
      line: "Rajan left something in the forge, in a sealed clay pot, for when things went wrong. They have gone wrong. Take it. Then climb to the temple — what's left of it wants to remake you into something that can actually do something about all this.",
      options: [
        {
          tag: 'NEUTRAL',
          text: '[Continue]',
          next: 'lore_seed',
        },
      ],
    },
    lore_seed: {
      speaker: 'Ghost of Devimaa',
      line: "One more thing, since you'll hear it eventually and I'd rather you hear it from someone who loved this valley. We are living in a wound between two ages — the sages call the four ages by color, but never speak of the seam between them. That seam is where we are now. Someone drove a wedge into it and is holding it open on purpose.",
      options: [
        {
          tag: 'NEUTRAL',
          text: '[Continue]',
          next: null,
          effects: { unlockLore: 'lore_cosmic_ages', setFlag: 'kalini_tutorial_devimaa_met' },
        },
      ],
    },
  },
};
