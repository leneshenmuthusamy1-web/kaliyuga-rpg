import { eventBus } from '../core/EventBus.js';
import { DialogueSystem } from '../systems/DialogueSystem.js';

const box = document.getElementById('dialogue-box');

const TAG_CLASS = { HONEST: 'honest', TACTICAL: 'tactical', DEFLECT: 'deflect' };

export const DialogueUI = {
  init() {
    eventBus.on('dialogue:node', (payload) => this.render(payload));
    eventBus.on('dialogue:ended', () => this.hide());
  },

  render({ speaker, line, options }) {
    box.classList.remove('hidden');
    const optionsHtml = options
      .map((opt, i) => {
        const tagHtml = TAG_CLASS[opt.tag] ? `<span class="tag ${TAG_CLASS[opt.tag]}">${opt.tag}</span>` : '';
        const lockedClass = opt.locked ? 'locked' : '';
        return `<button class="option ${lockedClass}" data-index="${i}" ${opt.locked ? 'title="' + (opt.lockedReason || '') + '"' : ''}>${tagHtml}${opt.text.replace(/^\[[A-Z]+\]\s*/, '')}</button>`;
      })
      .join('');

    box.innerHTML = `
      <div class="speaker">${speaker}</div>
      <div class="line">${line}</div>
      <div class="options">${optionsHtml || '<button class="option" data-continue="1">[Continue]</button>'}</div>
    `;

    box.querySelectorAll('.option').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('locked')) return;
        if (btn.dataset.continue) {
          DialogueSystem.advance();
          return;
        }
        DialogueSystem.choose(Number(btn.dataset.index));
      });
    });

    if (options.length === 0) {
      // Terminal node with no options — allow closing via a continue button.
      const contBtn = box.querySelector('[data-continue]');
      if (contBtn) contBtn.addEventListener('click', () => DialogueSystem.end());
    }
  },

  hide() {
    box.classList.add('hidden');
    box.innerHTML = '';
  },
};
