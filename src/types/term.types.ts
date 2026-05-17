import type { TERM_TYPES } from '../constants/termConstants.js';

export type TermType = typeof TERM_TYPES[number];

export type GetTermsQuery = {
  type?: TermType;
};

export interface AgreeTermsRequestBody {
  termIds: string[];
}
