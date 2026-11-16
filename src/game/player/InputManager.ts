export type InputAction =
  | 'interact'
  | 'scan'
  | 'map'
  | 'inventory'
  | 'objectives'
  | 'pause'
  | 'camera'
  | 'pp'
  | 'help'
  | 'jump'
  | 'tool1'
  | 'tool2'
  | 'tool3'
  | 'cycle-layer'
  | 'photo'
  | 'escape'
  | 'toggle-labels';

export class InputManager {
  keys = new Set<string>();
  mouseDX = 0;
  mouseDY = 0;
  wheel = 0;
  locked = false;
  dragging = false;
  private lastX = 0;
  private lastY = 0;
  private canvas: HTMLCanvasElement | null = null;
  private onAction: (action: InputAction) => void = () => {};
  private onLockChange: (locked: boolean) => void = () => {};
  touchMove = { x: 0, y: 0 };
  touchLook = { x: 0, y: 0 };
  /** On-screen D-pad direction (-1..1 per axis). Separate from touchMove so the stick and the pad never clear each other. */
  dpadMove = { x: 0, y: 0 };
  touchSprint = false;
  jumpQueued = false;
  private bound = false;
  private wasLocked = false;
  private skipNextPause = false;

  bind(canvas: HTMLCanvasElement, onAction: (a: InputAction) => void, onLockChange: (locked: boolean) => void) {
    if (this.bound) {
      this.canvas = canvas;
      this.onAction = onAction;
      this.onLockChange = onLockChange;
      return;
    }
    this.canvas = canvas;
    this.onAction = onAction;
    this.onLockChange = onLockChange;

    window.addEventListener('keydown', this.handleKeyDown, { passive: false });
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
    document.addEventListener('pointerlockchange', this.handlePointerLock);
    canvas.addEventListener('click', this.handleCanvasClick);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    this.bound = true;
  }

  requestLock() {
    if (!this.canvas || this.locked) return;
    try {
      const maybe = this.canvas.requestPointerLock() as unknown as Promise<void> | undefined;
      if (maybe && typeof maybe.catch === 'function') maybe.catch(() => {});
    } catch {
      /* Browser may refuse without a user gesture. */
    }
  }

  releaseLock() {
    if (document.pointerLockElement) document.exitPointerLock();
  }

  /** Releases the pointer for an instrument panel without triggering the pause action. */
  releaseForUI() {
    if (!document.pointerLockElement) return;
    this.skipNextPause = true;
    document.exitPointerLock();
  }

  private handleCanvasClick = () => {
    if (!this.locked && this.canvas) this.requestLock();
  };

  private handlePointerLock = () => {
    const locked = document.pointerLockElement === this.canvas;
    this.locked = locked;
    this.onLockChange(locked);
    if (this.wasLocked && !locked) {
      if (!this.skipNextPause) this.onAction('pause');
      this.skipNextPause = false;
    }
    if (locked) this.skipNextPause = false;
    this.wasLocked = locked;
  };

  private handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    this.dragging = true;
    this.lastX = e.clientX;
    this.lastY = e.clientY;
    if (!this.locked && this.canvas) this.requestLock();
  };

  private handlePointerUp = () => {
    this.dragging = false;
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (this.locked) {
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
      return;
    }
    if (this.dragging) {
      this.mouseDX += e.clientX - this.lastX;
      this.mouseDY += e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  };

  private handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    this.wheel += Math.sign(e.deltaY);
  };

  private handleBlur = () => {
    this.keys.clear();
    this.touchMove.x = 0;
    this.touchMove.y = 0;
    this.dpadMove.x = 0;
    this.dpadMove.y = 0;
    this.touchSprint = false;
  };

  private handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Tab' || e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'ArrowDown') e.preventDefault();
    if (!this.keys.has(e.code)) {
      switch (e.code) {
        case 'KeyE':
          this.onAction('interact');
          break;
        case 'KeyF':
          this.onAction('scan');
          break;
        case 'KeyM':
          this.onAction('map');
          break;
        case 'KeyI':
          this.onAction('inventory');
          break;
        case 'Tab':
          this.onAction('objectives');
          break;
        case 'Escape':
          e.preventDefault();
          this.onAction('pause');
          break;
        case 'KeyC':
          this.onAction('camera');
          break;
        case 'KeyP':
          this.onAction('pp');
          break;
        case 'KeyH':
          this.onAction('help');
          break;
        case 'Space':
          this.jumpQueued = true;
          this.onAction('jump');
          break;
        case 'Digit1':
          this.onAction('tool1');
          break;
        case 'Digit2':
          this.onAction('tool2');
          break;
        case 'Digit3':
          this.onAction('tool3');
          break;
        case 'KeyL':
          this.onAction('cycle-layer');
          break;
        case 'KeyV':
          this.onAction('toggle-labels');
          break;
        default:
          break;
      }
    }
    this.keys.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };

  consumeMouseDelta(): { x: number; y: number } {
    const d = { x: this.mouseDX, y: this.mouseDY };
    this.mouseDX = 0;
    this.mouseDY = 0;
    return d;
  }

  consumeWheel(): number {
    const w = this.wheel;
    this.wheel = 0;
    return w;
  }

  consumeJump(): boolean {
    const j = this.jumpQueued;
    this.jumpQueued = false;
    return j;
  }

  isDown(code: string) {
    return this.keys.has(code);
  }

  movementVector(): { x: number; y: number } {
    let x = 0;
    let y = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) y += 1;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) x += 1;
    if (Math.hypot(this.touchMove.x, this.touchMove.y) > 0.08) {
      x = this.touchMove.x;
      y = this.touchMove.y;
    } else if (this.dpadMove.x !== 0 || this.dpadMove.y !== 0) {
      x = this.dpadMove.x;
      y = this.dpadMove.y;
    }
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      x /= mag;
      y /= mag;
    }
    return { x, y };
  }

  get sprinting() {
    return this.touchSprint || this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  setTouchSprint(value: boolean) {
    this.touchSprint = value;
  }

  setTouchMove(x: number, y: number) {
    this.touchMove.x = x;
    this.touchMove.y = y;
  }

  setDpad(x: number, y: number) {
    this.dpadMove.x = x;
    this.dpadMove.y = y;
  }

  clearDpad() {
    this.dpadMove.x = 0;
    this.dpadMove.y = 0;
  }

  clearTouch() {
    this.touchMove.x = 0;
    this.touchMove.y = 0;
  }

  dispose() {
    if (!this.bound) return;
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
    document.removeEventListener('pointerlockchange', this.handlePointerLock);
    window.removeEventListener('pointerup', this.handlePointerUp);
    window.removeEventListener('pointermove', this.handlePointerMove);
    this.bound = false;
  }
}

export const inputManager = new InputManager();
