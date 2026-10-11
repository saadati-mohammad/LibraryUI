import { buildEntityFormData, buildFileFormData, buildQueryParams } from './http-request.util';

/** Reads a multipart part back as text (the JSON entity parts are Blobs). */
async function readPart(formData: FormData, field: string): Promise<string> {
  const part = formData.get(field);
  if (!(part instanceof Blob)) {
    throw new Error(`Expected '${field}' to be a Blob part, got ${String(part)}`);
  }
  return part.text();
}

describe('buildQueryParams', () => {
  it('always sends paging and sorting', () => {
    const params = buildQueryParams(undefined, 3, 25, 'title,asc');

    expect(params.get('page')).toBe('3');
    expect(params.get('size')).toBe('25');
    expect(params.get('sort')).toBe('title,asc');
  });

  it('defaults to page 0, size 10 and id,desc', () => {
    const params = buildQueryParams();

    expect(params.get('page')).toBe('0');
    expect(params.get('size')).toBe('10');
    expect(params.get('sort')).toBe('id,desc');
    expect(params.keys()).toEqual(['page', 'size', 'sort']);
  });

  it('keeps falsy-but-meaningful values (false and 0)', () => {
    const params = buildQueryParams({ active: false, copyCount: 0 });

    expect(params.get('active')).toBe('false');
    expect(params.get('copyCount')).toBe('0');
  });

  it('skips null, undefined and empty-string filters', () => {
    const params = buildQueryParams({ title: '', author: null, subject: undefined });

    expect(params.has('title')).toBe(false);
    expect(params.has('author')).toBe(false);
    expect(params.has('subject')).toBe(false);
  });

  it('accepts a null filter object', () => {
    expect(buildQueryParams(null).has('page')).toBe(true);
  });
});

describe('buildEntityFormData', () => {
  it('serialises the entity as an application/json Blob part', async () => {
    const formData = buildEntityFormData('book', { title: 'T', copyCount: 0 });

    expect(formData.get('book')).toBeInstanceOf(Blob);
    expect((formData.get('book') as Blob).type).toBe('application/json');
    expect(JSON.parse(await readPart(formData, 'book'))).toEqual({ title: 'T', copyCount: 0 });
  });

  it('appends the file part with its filename when a File is given', () => {
    const file = new File(['x'], 'cover.png');
    const formData = buildEntityFormData('book', { title: 'T' }, {
      fileField: 'bookCoverFile',
      file,
    });

    const uploaded = formData.get('bookCoverFile');
    expect(uploaded).toBeInstanceOf(File);
    expect((uploaded as File).name).toBe('cover.png');
  });

  it('sends no file part when the file is undefined (keep the stored file)', async () => {
    const formData = buildEntityFormData('person', { firstName: 'A' }, {
      fileField: 'profilePicture',
      file: undefined,
    });

    expect(formData.has('profilePicture')).toBe(false);
    expect(JSON.parse(await readPart(formData, 'person'))).toEqual({ firstName: 'A' });
  });

  it('nulls the file field inside the JSON and sends no part for null (delete the file)', async () => {
    const formData = buildEntityFormData('book', { title: 'T', bookCoverFile: 'old-url' }, {
      fileField: 'bookCoverFile',
      file: null,
    });

    expect(formData.has('bookCoverFile')).toBe(false);
    expect(JSON.parse(await readPart(formData, 'book'))).toEqual({
      title: 'T',
      bookCoverFile: null,
    });
  });

  it('does not mutate the entity it was given', () => {
    const entity = { title: 'T', bookCoverFile: 'old-url' };

    buildEntityFormData('book', entity, { fileField: 'bookCoverFile', file: null });

    expect(entity.bookCoverFile).toBe('old-url');
  });
});

describe('buildFileFormData', () => {
  it('wraps a single file part', () => {
    const file = new File(['x'], 'books.xlsx');
    const formData = buildFileFormData('file', file);

    expect(formData.get('file')).toBeInstanceOf(File);
    expect((formData.get('file') as File).name).toBe('books.xlsx');
  });
});
