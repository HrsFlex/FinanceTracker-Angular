// src/app/animations.ts
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';

export const logoAnimation = trigger('logoAnimation', [
  state('hidden', style({ opacity: 0, transform: 'scale(0.8)' })),
  state('visible', style({ opacity: 1, transform: 'scale(1)' })),
  transition('hidden => visible', [
    animate('0.3s 0.3s ease-in'), // 0.3s duration, 0.3s delay
  ]),
  transition('visible => hidden', [
    animate('0.3s ease-out'), // 0.3s fade-out
  ]),
]);
