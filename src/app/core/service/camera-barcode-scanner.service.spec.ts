import type { IScannerControls } from '@zxing/browser';
import { CameraBarcodeScannerService } from './camera-barcode-scanner.service';

describe('CameraBarcodeScannerService', () => {
  let service: CameraBarcodeScannerService;

  beforeEach(() => {
    service = new CameraBarcodeScannerService();
  });

  it('stops an active camera session and makes repeated stop calls safe', () => {
    const stop = vi.fn();
    (service as unknown as { controls: IScannerControls | null }).controls = { stop } as IScannerControls;

    service.stop();
    service.stop();

    expect(stop).toHaveBeenCalledOnce();
  });

  it('returns false when torch controls are unavailable', async () => {
    await expect(service.switchTorch(true)).resolves.toBe(false);
  });

  it('delegates torch changes to the active camera controls', async () => {
    const switchTorch = vi.fn().mockResolvedValue(undefined);
    (service as unknown as { controls: IScannerControls | null }).controls = {
      stop: vi.fn(), switchTorch,
    } as unknown as IScannerControls;

    await expect(service.switchTorch(true)).resolves.toBe(true);
    expect(switchTorch).toHaveBeenCalledWith(true);
  });
});
