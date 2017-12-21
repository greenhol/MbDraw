import { Directive, HostListener, Output, EventEmitter, OnDestroy } from '@angular/core';

// 01000 Tap
// 01010 Double Tap
// 01111 Long Tap
export enum TouchEnum {
  SINGLE_TAP,
  DOUBLE_TAP,
  LONG_TAP
}

export interface TouchData {
  type: TouchEnum,
  offsetX: number;
  offsetY: number;
}

enum TouchStateEnum {
  IDLE,
  ACTIVE,
  DONE
}

const THRESHOLD = 251;

@Directive({
  selector: '[mbTouchMe]'
})
export class TouchMeDirective implements OnDestroy {

  private state: TouchStateEnum = TouchStateEnum.IDLE;
  private pointerCnt = 0;
  private timerRef: number = 0;
  private lastPointerEvent: PointerEvent;

  @Output() mbTouchMe = new EventEmitter<TouchData>();

  constructor() { }

  ngOnDestroy() {
    clearTimeout(this.timerRef);
  }

  @HostListener('pointerdown', ['$event']) onPointerDown(event: PointerEvent) {
    // no multitouch allowed
    if (this.pointerCnt) return;

    this.pointerCnt++;
    this.lastPointerEvent = event;

    if (this.isActive) {
      this.finish();
      this.emitTouch(TouchEnum.DOUBLE_TAP);
      this.reset();
    } else {
      this.activate();
      this.timerRef = setTimeout(() => {
        this.emitTouch(TouchEnum.LONG_TAP);
        this.finish();
      }, THRESHOLD);
    }
  }

  @HostListener('pointerup') onPointerUp(event: PointerEvent) {
    if (this.pointerCnt !== 1) return;
    this.pointerCnt--;

    clearTimeout(this.timerRef);
    if (this.isActive)
    this.timerRef = setTimeout(() => {
      this.finish();
      this.emitTouch(TouchEnum.SINGLE_TAP);
      this.reset();
    }, THRESHOLD);


    this.reset();
  }

  // Private
  private activate() {
    this.stateTransfer(TouchStateEnum.IDLE, TouchStateEnum.ACTIVE);
  }

  private finish() {
    this.stateTransfer(TouchStateEnum.ACTIVE, TouchStateEnum.DONE);
  }

  private reset() {
    this.stateTransfer(TouchStateEnum.DONE, TouchStateEnum.IDLE);
  }

  private stateTransfer(from: TouchStateEnum, to: TouchStateEnum) {
    if (this.state === from) this.state = to;
  }

  private get isActive(): boolean {
    return this.state === TouchStateEnum.ACTIVE;
  }

  private emitTouch(type: TouchEnum) {
    this.mbTouchMe.emit({ type: type, offsetX: this.lastPointerEvent.offsetX, offsetY: this.lastPointerEvent.offsetY });
  }

}
