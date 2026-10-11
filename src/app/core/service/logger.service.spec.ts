import { TestBed } from '@angular/core/testing';
import { isDevMode } from '@angular/core';

import { LoggerService } from './logger.service';

describe('LoggerService', () => {
    let service: LoggerService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(LoggerService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('routes warn and error to console unconditionally', () => {
        const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
        const errorSpy = vi.spyOn(console, 'error').mockReturnValue(undefined);

        service.warn('w');
        service.error('e');

        expect(warnSpy).toHaveBeenCalledWith('w');
        expect(errorSpy).toHaveBeenCalledWith('e');
    });

    it('emits debug/info only when isDevMode() is true', () => {
        const logSpy = vi.spyOn(console, 'log').mockReturnValue(undefined);
        const infoSpy = vi.spyOn(console, 'info').mockReturnValue(undefined);

        service.debug('d');
        service.info('i');

        // In a Karma dev build isDevMode() is true; in a production build both spies
        // would stay silent. Either way the calls must never throw and the guard must
        // follow isDevMode(), not a hardcoded flag.
        if (isDevMode()) {
            expect(logSpy).toHaveBeenCalledWith('d');
            expect(infoSpy).toHaveBeenCalledWith('i');
        }
        else {
            expect(logSpy).not.toHaveBeenCalled();
            expect(infoSpy).not.toHaveBeenCalled();
        }
    });
});
