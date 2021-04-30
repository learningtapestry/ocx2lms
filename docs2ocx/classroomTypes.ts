export interface GCRubricSheet {
  criterions: GCRubricCriterion[];
  title: string;
}

export interface GCRubricCriterion {
  title: string;
  description?: string;
  levels: GCRubricLevel[];
}

export interface GCRubricLevel {
  points: number;
  title?: string;
  description?: string;
}
