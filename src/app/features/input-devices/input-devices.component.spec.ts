import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { InputDevice, InputSourceType } from '../../core/model/input-device.model';
import { InputDeviceService } from '../../core/service/input-device.service';
import type { InputFormPolicy } from '../../core/model/input-device.model';
import { InputDevicesComponent } from './input-devices.component';

const TYPES: InputSourceType[] = [{
  key: 'KEYBOARD_WEDGE', displayName: 'اسکنر کیبوردی', capabilities: ['usb', 'bluetooth'],
  configSchema: { type: 'object', properties: { terminator: { type: 'string', enum: ['ENTER', 'TAB', 'NONE'] }, minimumLength: { type: 'integer', minimum: 1, maximum: 128 } } },
}];
const DEVICE: InputDevice = {
  id: 1, name: 'میز امانت', typeKey: 'KEYBOARD_WEDGE', ownerUsername: null, station: 'میز ۱', config: { terminator: 'ENTER' },
  capabilities: ['usb'], enabled: true, revoked: false, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', lastSeenAt: null, version: 0,
};
const POLICY: InputFormPolicy = { formKey: 'book-registration', station: '', allowedSources: ['MANUAL'], defaultSource: 'MANUAL', scope: 'global', updatedBy: 'admin', updatedAt: null, version: 0 };

describe('InputDevicesComponent', () => {
  let fixture: ComponentFixture<InputDevicesComponent>;
  let component: InputDevicesComponent;
  let service: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    service = {
      types: vi.fn().mockReturnValue(of(TYPES)), list: vi.fn().mockReturnValue(of([DEVICE])),
      create: vi.fn().mockReturnValue(of({ device: DEVICE, token: 'one-time-secret' })),
      update: vi.fn().mockReturnValue(of(DEVICE)), enable: vi.fn().mockReturnValue(of(DEVICE)),
      disable: vi.fn().mockReturnValue(of(DEVICE)), revoke: vi.fn().mockReturnValue(of(DEVICE)),
      rotateToken: vi.fn().mockReturnValue(of({ device: DEVICE, token: 'rotated-secret' })),
      audit: vi.fn().mockReturnValue(of([])),
      globalPolicy: vi.fn().mockReturnValue(of(POLICY)), saveGlobalPolicy: vi.fn().mockReturnValue(of(POLICY)),
    };
    await TestBed.configureTestingModule({
      imports: [InputDevicesComponent],
      providers: [provideNoopAnimations(), { provide: InputDeviceService, useValue: service }],
    }).compileComponents();
    fixture = TestBed.createComponent(InputDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders configuration controls from the provider schema and lists device health', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('اسکنر کیبوردی');
    expect(text).toContain('پایان‌دهنده');
    expect(text).toContain('حداقل طول بارکد');
    expect(text).toContain('میز امانت');
  });

  it('creates a device and exposes its bearer credential once for safe provisioning', () => {
    component.draft.name = 'اسکنر میز ۲';
    component.draft.typeKey = 'KEYBOARD_WEDGE';
    component.draft.config = { terminator: 'ENTER' };
    component.save();
    fixture.detectChanges();

    expect(service['create']).toHaveBeenCalledWith({ name: 'اسکنر میز ۲', typeKey: 'KEYBOARD_WEDGE', ownerUsername: null, station: null, config: { terminator: 'ENTER' } });
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('one-time-secret');
    component.dismissToken();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('one-time-secret');
  });

  it('loads and saves a per-form source policy with its selected station and default', () => {
    component.policyStation.set('میز ۱');
    component.policyAllowed.set(['MANUAL', 'KEYBOARD_WEDGE']);
    component.policyDefault.set('KEYBOARD_WEDGE');
    component.savePolicy();

    expect(service['saveGlobalPolicy']).toHaveBeenCalledWith('book-registration', {
      allowedSources: ['MANUAL', 'KEYBOARD_WEDGE'], defaultSource: 'KEYBOARD_WEDGE', station: 'میز ۱', ownerUsername: undefined,
    });
    expect(component.policyScope()).toBe('global');
  });
});
