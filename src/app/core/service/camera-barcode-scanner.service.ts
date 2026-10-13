import { Injectable } from '@angular/core';
import type { IScannerControls } from '@zxing/browser';
import type { DecodeHintType as DecodeHintKey } from '@zxing/library';

export interface CameraScanSession {
  devices: MediaDeviceInfo[];
  selectedDeviceId: string;
  torchSupported: boolean;
}

/** Owns browser camera lifecycle and decoding controls, separate from any particular form. */
@Injectable({ providedIn: 'root' })
export class CameraBarcodeScannerService {
  private controls: IScannerControls | null = null;
  private generation = 0;

  async start(
    video: HTMLVideoElement,
    preferredDeviceId: string,
    onFrame: (value: string | null) => void,
  ): Promise<CameraScanSession> {
    this.stop();
    const generation = this.generation;
    const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
      import('@zxing/browser'), import('@zxing/library'),
    ]);
    const hints = new Map<DecodeHintKey, unknown>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.UPC_A, BarcodeFormat.CODE_128]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);
    const videoConstraints: MediaTrackConstraints = preferredDeviceId
      ? { deviceId: { exact: preferredDeviceId } }
      : { facingMode: { ideal: 'environment' } };
    const controls = await reader.decodeFromConstraints(
      { audio: false, video: videoConstraints }, video,
      result => {
        if (generation === this.generation) onFrame(result?.getText() ?? null);
      },
    );
    if (generation !== this.generation) {
      controls.stop();
      throw new DOMException('Camera startup was cancelled.', 'AbortError');
    }
    this.controls = controls;

    const [devices, activeDeviceId] = await Promise.all([
      BrowserMultiFormatReader.listVideoInputDevices().catch(() => []),
      Promise.resolve(typeof MediaStream !== 'undefined' && video.srcObject instanceof MediaStream
        ? video.srcObject.getVideoTracks()[0]?.getSettings().deviceId : undefined),
    ]);
    if (generation !== this.generation) throw new DOMException('Camera startup was cancelled.', 'AbortError');
    return {
      devices,
      selectedDeviceId: activeDeviceId ?? preferredDeviceId,
      torchSupported: typeof this.controls.switchTorch === 'function',
    };
  }

  stop(): void {
    this.generation++;
    this.controls?.stop();
    this.controls = null;
  }

  async switchTorch(enabled: boolean): Promise<boolean> {
    if (!this.controls?.switchTorch) return false;
    await this.controls.switchTorch(enabled);
    return true;
  }
}
