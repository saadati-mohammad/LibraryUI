import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { InputDeviceRuntimeProfile } from '../../core/model/input-device.model';
import { KeyboardWedgeScannerDirective } from './keyboard-wedge-scanner.directive';

// Each host has a fixed profile set in the class initialiser — no detectChanges() needed
// after profile mutation, which avoids Zone.js/JSDOM event-dispatch ordering issues.

@Component({
  standalone: true, imports: [KeyboardWedgeScannerDirective],
  template: `<input [appKeyboardWedgeScanner]="profile" (scanDetected)="scanned = $event"
    (scanRejected)="rejected = $event" (enterPressed)="manualEnterCount = manualEnterCount + 1">`,
})
class EnterTerminatorHost {
  readonly profile: InputDeviceRuntimeProfile = {
    deviceId: 1, name: 'enter-scanner', typeKey: 'KEYBOARD_WEDGE',
    config: { prefix: '[', suffix: ']', terminator: 'ENTER', minimumLength: 10 },
  };
  scanned = ''; rejected = ''; manualEnterCount = 0;
}

@Component({
  standalone: true, imports: [KeyboardWedgeScannerDirective],
  template: `<input [appKeyboardWedgeScanner]="profile" (scanDetected)="scanned = $event"
    (scanRejected)="rejected = $event">`,
})
class AfixRejectionHost {
  // minimumLength:1 and prefix set — sending chars without prefix triggers rejection
  readonly profile: InputDeviceRuntimeProfile = {
    deviceId: 2, name: 'affix-scanner', typeKey: 'KEYBOARD_WEDGE',
    config: { prefix: '[', suffix: ']', terminator: 'ENTER', minimumLength: 1 },
  };
  scanned = ''; rejected = '';
}

@Component({
  standalone: true, imports: [KeyboardWedgeScannerDirective],
  template: `<input [appKeyboardWedgeScanner]="null" (enterPressed)="manualEnterCount = manualEnterCount + 1">`,
})
class NoProfileHost { manualEnterCount = 0; }

@Component({
  standalone: true, imports: [KeyboardWedgeScannerDirective],
  template: `<input [appKeyboardWedgeScanner]="profile" (scanDetected)="scanned = $event">`,
})
class NoneTerminatorHost {
  readonly profile: InputDeviceRuntimeProfile = {
    deviceId: 3, name: 'none-term-scanner', typeKey: 'KEYBOARD_WEDGE',
    config: { terminator: 'NONE', minimumLength: 1 },
  };
  scanned = '';
}

/** Simulate a rapid scanner burst by dispatching keydown events on the input. */
function sendFast(input: HTMLInputElement, value: string): void {
  for (const key of value) {
    input.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    input.value += key;
  }
}

describe('KeyboardWedgeScannerDirective', () => {
  it('strips configured prefix/suffix and consumes the configured fast Enter terminator', async () => {
    const fixture = TestBed.createComponent(EnterTerminatorHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    sendFast(input, '[1234567890]');
    const terminator = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(terminator);
    fixture.detectChanges();

    expect(terminator.defaultPrevented).toBe(true);
    expect(host.scanned).toBe('1234567890');
    expect(input.value).toBe('');
    expect(host.manualEnterCount).toBe(0);
  });

  it('rejects barcode content that does not match the configured affixes', () => {
    const fixture = TestBed.createComponent(AfixRejectionHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    sendFast(input, 'X'); // 'X' lacks the required '[' prefix → rejected
    const terminator = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    input.dispatchEvent(terminator);
    fixture.detectChanges();

    expect(host.rejected).toBeTruthy();
    expect(host.scanned).toBe('');
  });

  it('emits enterPressed and does not scan when no scanner profile is configured', () => {
    const fixture = TestBed.createComponent(NoProfileHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.manualEnterCount).toBe(1);
  });

  it('auto-finishes a fast scan for devices without a terminator after the idle timeout', async () => {
    const fixture = TestBed.createComponent(NoneTerminatorHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');

    sendFast(input, 'X');
    // Wait > NO_TERMINATOR_IDLE_MS (120 ms). vi.useFakeTimers() conflicts with Zone.js setTimeout.
    await new Promise<void>(resolve => setTimeout(resolve, 200));
    fixture.detectChanges();

    expect(host.scanned).toBe('X');
  });
});
