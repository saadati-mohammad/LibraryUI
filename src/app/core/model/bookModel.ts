export class BookModel {
    id?: number;
    
    isbn10?: string;
    title?: string;
    author?: string;
    translator?: string;
    description?: string;

    publisher?: string;
    isbn13?: string;
    deweyDecimal?: string;
    congressClassification?: string;
    subject?: string;
    summary?: string;
    publicationDate?: number;
    pageCount?: number;
    language?: string;
    edition?: string;
    active?: boolean;
    bookCoverFile?: any;

    copyCount?: number;
    librarySection?: string;
    shelfCode?: string;     
    rowNumber?: string;     
    columnNumber?: string;  
    positionNote?: string;  
}