import { audio } from "@shared/audio.js";

const RECIPES = {
  tick: [[880, 0.09, { gain: 0.16 }]],
  tickLast: [[1320, 0.14, { gain: 0.2 }]],
  chime: [
    [880, 0.4, { gain: 0.26, attack: 0.02 }],
    [1318.5, 0.4, { gain: 0.26, attack: 0.02, when: 0.16 }],
  ],
  bell: [
    [660, 0.7, { type: "triangle", gain: 0.22, attack: 0.015 }],
    [1320, 0.5, { gain: 0.1, when: 0.02 }],
  ],
  gong: [
    [196, 2.4, { gain: 0.26, attack: 0.015 }],
    [294, 2.0, { gain: 0.14, attack: 0.015, when: 0.06 }],
    [392, 2.2, { gain: 0.14, attack: 0.015, when: 0.01 }],
    [588, 1.8, { gain: 0.09, attack: 0.015, when: 0.03 }],
    [784, 1.4, { gain: 0.06, attack: 0.015, when: 0.05 }],
  ],
  success: [
    [523, 0.15, { gain: 0.12 }],
    [659, 0.15, { gain: 0.12, when: 0.13 }],
    [784, 0.3, { gain: 0.12, when: 0.26 }],
  ],
};

export const TEST_SEQUENCE = [
  { name: "tick", label: "Tick", note: "each breath", at: 0 },
  { name: "chime", label: "Chime", note: "hold starts and ends", at: 900 },
  { name: "bell", label: "Bell", note: "meditation start and interval", at: 2100 },
  { name: "gong", label: "Gong", note: "meditation end", at: 3500 },
];

export const gainFor = (volume) => {
  const v = Math.min(100, Math.max(0, typeof volume === "number" ? volume : 100)) / 100;
  return v * v;
};

export function playSound(name, volume) {
  const g = gainFor(volume);
  const recipe = RECIPES[name];
  if (!recipe || g <= 0) return;
  for (const [freq, dur, opts] of recipe) audio.tone(freq, dur, { ...opts, gain: opts.gain * g });
}
