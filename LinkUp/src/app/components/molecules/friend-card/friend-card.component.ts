import {
  Component,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { createGesture, Gesture, GestureDetail } from '@ionic/angular/standalone';

@Component({
  selector: 'molecule-friend-card',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './friend-card.component.html',
  styleUrls: ['./friend-card.component.scss']
})
export class FriendCardComponent implements AfterViewInit, OnDestroy {
  @Input() name: string = '';
  @Input() bio: string = '';
  @Input() mutual: number = 0;
  @Input() avatar: string = '';
  @Input() showActions: boolean = true;
  @Input() large: boolean = false;
  @Output() accept = new EventEmitter<void>();
  @Output() reject = new EventEmitter<void>();

  @ViewChild('cardEl', { static: true }) private cardRef!: ElementRef<HTMLElement>;

  actionState: 'accept' | 'reject' | '' = '';
  swipeHint: 'accept' | 'reject' | '' = '';

  private gesture?: Gesture;
  private readonly commitThreshold = 120;
  private readonly maxRotationDeg = 10;

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    if (!this.showActions) return;

    this.zone.runOutsideAngular(() => {
      this.gesture = createGesture({
        el: this.cardRef.nativeElement,
        gestureName: 'friend-card-swipe',
        direction: 'x',
        threshold: 10,
        onStart: () => this.onDragStart(),
        onMove: (detail) => this.onDragMove(detail),
        onEnd: (detail) => this.onDragEnd(detail),
      });
      this.gesture.enable(true);
    });
  }

  ngOnDestroy(): void {
    this.gesture?.destroy();
  }

  handleAccept(): void {
    this.animateAction('accept');
  }

  handleReject(): void {
    this.animateAction('reject');
  }

  private animateAction(action: 'accept' | 'reject'): void {
    this.actionState = action;
    setTimeout(() => {
      this.actionState = '';
      if (action === 'accept') {
        this.accept.emit();
      } else {
        this.reject.emit();
      }
    }, 180);
  }

  private onDragStart(): void {
    const card = this.cardRef.nativeElement;
    card.style.transition = 'none';
  }

  private onDragMove(detail: GestureDetail): void {
    const card = this.cardRef.nativeElement;
    const deltaX = detail.deltaX;
    const rotation = Math.max(-this.maxRotationDeg, Math.min(this.maxRotationDeg, deltaX / 14));

    card.style.transform = `translateX(${deltaX}px) rotate(${rotation}deg)`;
    const intensity = Math.min(Math.abs(deltaX) / this.commitThreshold, 1).toFixed(2);
    card.style.setProperty('--swipe-hint-accept-opacity', deltaX > 0 ? intensity : '0');
    card.style.setProperty('--swipe-hint-reject-opacity', deltaX < 0 ? intensity : '0');

    const hint = deltaX > 24 ? 'accept' : deltaX < -24 ? 'reject' : '';
    if (hint !== this.swipeHint) {
      this.zone.run(() => (this.swipeHint = hint));
    }
  }

  private onDragEnd(detail: GestureDetail): void {
    const card = this.cardRef.nativeElement;
    const deltaX = detail.deltaX;
    const committed = Math.abs(deltaX) >= this.commitThreshold;

    if (!committed) {
      card.style.transition = 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1)';
      void card.offsetWidth; // fuerza reflow para que la transición arranque desde la posición actual
      card.style.transform = 'translateX(0) rotate(0deg)';
      card.style.setProperty('--swipe-hint-accept-opacity', '0');
      card.style.setProperty('--swipe-hint-reject-opacity', '0');
      this.zone.run(() => (this.swipeHint = ''));

      this.settleOnce(card, 300, () => {
        card.style.transition = '';
        card.style.transform = '';
      });
      return;
    }

    const direction: 'accept' | 'reject' = deltaX > 0 ? 'accept' : 'reject';
    const flyX = (deltaX > 0 ? 1 : -1) * (card.clientWidth + 200);
    const flyRotation = deltaX > 0 ? this.maxRotationDeg * 2.4 : -this.maxRotationDeg * 2.4;

    card.style.transition = 'transform 0.22s ease-out, opacity 0.22s ease-out';
    void card.offsetWidth; // fuerza reflow para que la transición arranque desde la posición actual
    card.style.transform = `translateX(${flyX}px) rotate(${flyRotation}deg)`;
    card.style.opacity = '0';

    this.settleOnce(card, 280, () => {
      card.style.transition = 'none';
      card.style.transform = '';
      card.style.opacity = '';
      card.style.setProperty('--swipe-hint-accept-opacity', '0');
      card.style.setProperty('--swipe-hint-reject-opacity', '0');
      this.zone.run(() => {
        this.swipeHint = '';
        if (direction === 'accept') {
          this.accept.emit();
        } else {
          this.reject.emit();
        }
      });
    });
  }

  /**
   * Ejecuta `fn` una sola vez, en cuanto termine la transición CSS o, como red de
   * seguridad, tras `timeoutMs` (p. ej. si `prefers-reduced-motion` fuerza una
   * duración ~0 y el navegador nunca llega a disparar `transitionend`).
   */
  private settleOnce(el: HTMLElement, timeoutMs: number, fn: () => void): void {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      el.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(timer);
      fn();
    };
    const onTransitionEnd = () => run();
    const timer = setTimeout(run, timeoutMs);
    el.addEventListener('transitionend', onTransitionEnd);
  }
}
