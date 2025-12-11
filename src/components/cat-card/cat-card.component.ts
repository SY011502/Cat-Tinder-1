import { Component, ChangeDetectionStrategy, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Cat } from '../../interfaces/cat.interface';

@Component({
  selector: 'app-cat-card',
  templateUrl: './cat-card.component.html',
  imports: [CommonModule, NgOptimizedImage],
  host: {
    '(mousedown)': 'onPanStart($event)',
    '(touchstart)': 'onPanStart($event)',
  }
})
export class CatCardComponent {
  cat = input.required<Cat>();
  active = input(false);
  trigger = input<{liked: boolean; targetId: string} | null>();
  swiped = output<boolean>();
  zoom = output<Cat>();

  translateX = signal(0);
  rotation = signal(0);
  isPanning = signal(false);
  isAnimating = signal(false);

  private panStartX = 0;
  private readonly SWIPE_THRESHOLD = 80; 

  constructor() {
    effect(() => {
      const swipe = this.trigger();
      if (swipe && this.active() && swipe.targetId === this.cat().id) {
        this.onButtonSwipe(swipe.liked);
      }
    });
  }

  cardTransform = computed(() => `translateX(${this.translateX()}px) rotate(${this.rotation()}deg)`);
  likeOpacity = computed(() => Math.max(0, this.translateX() / (this.SWIPE_THRESHOLD / 2)));
  nopeOpacity = computed(() => Math.max(0, -this.translateX() / (this.SWIPE_THRESHOLD / 2)));

  onButtonSwipe(liked: boolean) {
    if (!this.active()) return;
    this.isAnimating.set(true);
    const direction = liked ? 1 : -1;
    this.translateX.set(direction * (window.innerWidth / 2 + 200));
    this.rotation.set(direction * 30);
    setTimeout(() => this.swiped.emit(liked), 300);
  }

  onZoomClick(event: MouseEvent) {
    event.stopPropagation();
    this.zoom.emit(this.cat());
  }

  onPanStart(event: MouseEvent | TouchEvent) {
    if (!this.active() || this.isPanning()) return;
    event.preventDefault();
    this.isAnimating.set(false);
    this.isPanning.set(true);
    this.panStartX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    
    window.addEventListener('mousemove', this.onPanMove, { passive: true });
    window.addEventListener('touchmove', this.onPanMove, { passive: true });
    window.addEventListener('mouseup', this.onPanEnd, { once: true });
    window.addEventListener('touchend', this.onPanEnd, { once: true });
  }

  private onPanMove = (event: MouseEvent | TouchEvent) => {
    if (!this.isPanning()) return;
    const currentX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const deltaX = currentX - this.panStartX;
    this.translateX.set(deltaX);
    this.rotation.set(deltaX / 20);
  }

  private onPanEnd = () => {
    if (!this.isPanning()) return;
    this.isPanning.set(false);
    this.isAnimating.set(true);

    this.removeWindowListeners();

    const deltaX = this.translateX();
    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD) {
      const liked = deltaX > 0;
      const direction = liked ? 1 : -1;
      this.translateX.set(direction * (window.innerWidth / 2 + 200));
      this.rotation.set(direction * 30);
      
      setTimeout(() => {
        this.swiped.emit(liked);
      }, 300);
    } else {
      this.translateX.set(0);
      this.rotation.set(0);
    }
  }
  
  private removeWindowListeners() {
    window.removeEventListener('mousemove', this.onPanMove);
    window.removeEventListener('touchmove', this.onPanMove);
  }
}