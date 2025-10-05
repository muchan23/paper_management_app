export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract?: string;
  doi?: string;
  publicationDate?: Date;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pdfUrl?: string;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  details?: PaperDetails;
}

export interface PaperDetails {
  id: string;
  summary?: string;
  methodology?: string;
  benefits?: string;
  verification?: string;
  discussion?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  paperId: string;
}

export interface CreatePaperInput {
  title: string;
  authors: string[];
  abstract?: string;
  doi?: string;
  publicationDate?: Date;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
}

export interface UpdatePaperInput extends Partial<CreatePaperInput> {
  id: string;
}

export interface SearchFilters {
  query?: string;
  authors?: string[];
  journal?: string;
  yearFrom?: number;
  yearTo?: number;
  tags?: string[];
}
