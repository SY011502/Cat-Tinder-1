
import { Component, ChangeDetectionStrategy, signal, inject, OnInit, WritableSignal, effect } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { CatCardComponent } from './components/cat-card/cat-card.component';
import { CatService } from './services/cat.service';
import { Cat } from './interfaces/cat.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NgOptimizedImage, CatCardComponent]
})
export class AppComponent implements OnInit {
  private catService = inject(CatService);

  view: WritableSignal<'loading' | 'swiping' | 'summary'> = signal('loading');
  cats: WritableSignal<Cat[]> = signal([]);
  likedCats: WritableSignal<Cat[]> = signal([]);
  currentIndex: WritableSignal<number> = signal(0);
  selectedCat = signal<Cat | null>(null);
  
  // A signal to trigger swipe animations via buttons
  triggerSwipe: WritableSignal<{liked: boolean; targetId: string} | null> = signal(null);

  ngOnInit() {
    this.loadCats();
  }

  loadCats() {
    this.view.set('loading');
    this.catService.getCats(15).subscribe({
      next: (cats) => {
        if (cats.length === 0) {
            this.cats.set([]);
            this.view.set('summary');
            return;
        }

        const imagePromises = cats.map(cat => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = `https://cataas.com/cat/${cat.id}`;
            img.onload = resolve;
            img.onerror = resolve; // Resolve even on error to not block the UI
          });
        });

        Promise.all(imagePromises).then(() => {
          this.cats.set(cats);
          this.currentIndex.set(0);
          this.likedCats.set([]);
          this.view.set('swiping');
        });
      },
      error: () => {
        this.cats.set([]);
        this.view.set('summary'); 
      }
    });
  }

  onSwiped(liked: boolean) {
    if (this.currentIndex() < this.cats().length) {
      const cat = this.cats()[this.currentIndex()];
      if (liked) {
        this.likedCats.update(cats => [...cats, cat]);
      }
      this.currentIndex.update(i => i + 1);

      if (this.currentIndex() >= this.cats().length) {
        setTimeout(() => this.view.set('summary'), 500);
      }
    }
  }
  
  swipeAction(liked: boolean) {
    if (this.currentIndex() < this.cats().length) {
      const targetId = this.cats()[this.currentIndex()].id;
      this.triggerSwipe.set({ liked, targetId });
    }
  }

  reset() {
    this.selectedCat.set(null);
    this.loadCats();
  }
  
  selectCat(cat: Cat) {
    this.selectedCat.set(cat);
  }

  deselectCat() {
    this.selectedCat.set(null);
  }
  
  getCardTransform(index: number): string {
    const relativeIndex = index - this.currentIndex();
    if (relativeIndex < 0) return 'translateX(100vw)';
    if (relativeIndex === 0) return 'rotate(0deg) scale(1)';
    if (relativeIndex > 2) return `scale(${1 - 3 * 0.04}) translateY(-${3 * 12}px) translateZ(-${3*50}px)`;

    const scale = 1 - relativeIndex * 0.04;
    const translateY = -relativeIndex * 12;
    const translateZ = -relativeIndex * 50;
    return `scale(${scale}) translateY(${translateY}px) translateZ(${translateZ}px)`;
  }
}