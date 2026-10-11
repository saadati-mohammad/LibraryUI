import type { Mock } from "vitest";
import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ImageLoaderService } from './image-loader.service';
import { environment } from '../../../environments/environment';

const COVER_URL = `${environment.apiUrl}/book/7/cover`;
const PICTURE_URL = `${environment.apiUrl}/person/3/picture`;

describe('ImageLoaderService', () => {
    let service: ImageLoaderService;
    let httpMock: HttpTestingController;
    let createObjectURL: Mock;
    let revokeObjectURL: Mock;
    let nextObjectUrl: number;

    beforeEach(() => {
        nextObjectUrl = 0;
        createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:mock/${++nextObjectUrl}`);
        revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue(undefined);

        TestBed.configureTestingModule({
            providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
        });
        service = TestBed.inject(ImageLoaderService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('requests the cover as a blob so the auth interceptor can attach the token', () => {
        service.getCover(7).subscribe((image) => {
            expect(image?.objectUrl).toBe('blob:mock/1');
        });

        const req = httpMock.expectOne(COVER_URL);
        expect(req.request.method).toBe('GET');
        expect(req.request.responseType).toBe('blob');
        req.flush(new Blob(['x'], { type: 'image/png' }));

        expect(createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('requests member pictures from the person endpoint', () => {
        service.getPicture(3).subscribe();
        httpMock.expectOne(PICTURE_URL).flush(new Blob(['x'], { type: 'image/jpeg' }));
        expect(createObjectURL).toHaveBeenCalledTimes(1);
    });

    it('serves repeat requests for the same id from cache without a second call', () => {
        service.getCover(7).subscribe();
        httpMock.expectOne(COVER_URL).flush(new Blob(['x']));

        let cachedUrl: string | null = null;
        service.getCover(7).subscribe((image) => (cachedUrl = image?.objectUrl ?? null));

        httpMock.expectNone(COVER_URL);
        expect(cachedUrl as string | null).toBe('blob:mock/1');
        expect(service.getCached('cover', 7)).toBe('blob:mock/1');
    });

    it('coalesces concurrent requests for the same id into one call', () => {
        const results: (string | null)[] = [];
        service.getCover(7).subscribe((image) => results.push(image?.objectUrl ?? null));
        service.getCover(7).subscribe((image) => results.push(image?.objectUrl ?? null));

        const requests = httpMock.match(COVER_URL);
        expect(requests.length).toBe(1);
        requests[0].flush(new Blob(['x']));

        expect(results.length).toBe(2);
    });

    it('revokes the previous object URL when an image is refreshed', () => {
        service.getCover(7).subscribe();
        httpMock.expectOne(COVER_URL).flush(new Blob(['x']));

        service.getCover(7, { refresh: true }).subscribe((image) => {
            expect(image?.objectUrl).toBe('blob:mock/2');
        });
        httpMock.expectOne(COVER_URL).flush(new Blob(['y']));

        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
        expect(service.getCached('cover', 7)).toBe('blob:mock/2');
    });

    it('revokes the object URL when the image is forgotten (after upload or delete)', () => {
        service.getCover(7).subscribe();
        httpMock.expectOne(COVER_URL).flush(new Blob(['x']));

        service.forget('cover', 7);

        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
        expect(service.getCached('cover', 7)).toBeNull();
        expect(service.covers.has(7)).toBe(false);
    });

    it('resolves to null and remembers the miss on 404/403 instead of throwing', () => {
        let result: unknown = 'unset';
        let errored = false;
        service.getCover(7).subscribe({
            next: (image) => (result = image),
            error: () => (errored = true),
        });

        httpMock.expectOne(COVER_URL).flush(null, { status: 404, statusText: 'Not Found' });

        expect(result).toBeNull();
        expect(errored).toBe(false);
        expect(service.isKnownMissing('cover', 7)).toBe(true);

        // A remembered miss is not re-requested.
        service.getCover(7).subscribe((image) => expect(image).toBeNull());
        httpMock.expectNone(COVER_URL);
    });

    it('re-requests a previously missing image after an explicit refresh', () => {
        service.getCover(7).subscribe();
        httpMock.expectOne(COVER_URL).flush(null, { status: 404, statusText: 'Not Found' });

        service.getCover(7, { refresh: true }).subscribe();
        httpMock.expectOne(COVER_URL).flush(new Blob(['x']));

        expect(service.getCached('cover', 7)).toBe('blob:mock/1');
        expect(service.isKnownMissing('cover', 7)).toBe(false);
    });

    it('revokes every object URL it created on revokeAll', () => {
        service.getCover(7).subscribe();
        httpMock.expectOne(COVER_URL).flush(new Blob(['x']));
        service.getPicture(3).subscribe();
        httpMock.expectOne(PICTURE_URL).flush(new Blob(['y']));

        service.revokeAll();

        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/1');
        expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock/2');
        expect(service.covers.size).toBe(0);
        expect(service.pictures.size).toBe(0);
    });

    it('preloads only the ids it is given', () => {
        service.preloadCovers([1, 2]);

        httpMock.expectOne(`${environment.apiUrl}/book/1/cover`).flush(new Blob(['a']));
        httpMock.expectOne(`${environment.apiUrl}/book/2/cover`).flush(new Blob(['b']));
        httpMock.expectNone(`${environment.apiUrl}/book/3/cover`);
    });

    it('returns null synchronously for an unknown or null id', () => {
        expect(service.getCached('cover', null)).toBeNull();
        expect(service.getCached('cover', 99)).toBeNull();
        expect(service.isKnownMissing('picture', null)).toBe(true);
    });
});
