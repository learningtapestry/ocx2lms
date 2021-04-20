export const DocumentMetadataKeys = {
  type: "type",
  grade: "grade",
  "guidebook-type": "guidebook_type",
  "guidebook-title": "guidebook_title",
  section: "section",
  lesson: "lesson",
  "lesson-title": "lesson_title",
  "lesson-type": "lesson_type",
  "lesson-description": "lesson_description",
  "lesson-look-fors": "lesson_look_fors",
  "look-fors": "look_fors",
};

export const ActivityMetadataKeys = {
  activity: "activity",
  "activity-type": "activity_type",
  "activity-title": "activity_title",
  pacing: "pacing",
  alignment: "alignment",
  when: "when",
  focus: "focus",
  "assignment-modality": "assignment_modality",
  "about-the-activity-student": "about_the_activity_student",
  "about-the-activity-teacher": "about_the_activity_teacher",
  "assignment-outcome": "assignment_outcome",
  "assignment-group": "assignment_group",
  "progressive-assignment-group": "progressive_assignment_group",
  "total-points": "total_points",
  "rubric-id": "rubric_id",
  "assignment-method": "assignment_method",
  texts: "texts",
};

export const MaterialMetadataKeys = {
  identifier: "identifier",
  title: "title",
  "material-type": "material_type",
  grade: "grade",
  audience: "audience",
  access: "access",
  link: "link",
  "guidebook-type": "guidebook_type",
};

export type DocumentTypes = "material" | "lesson" | "unit" | "progressive";

export interface DocumentMetadata {
  description: string;
  type: DocumentTypes;
  grade: string;
  guidebook_type: string;
  guidebook_title: string;
  section: string;
  lesson: string;
  lesson_title: string;
  lesson_type: string;
  lesson_description: string;
  lesson_look_fors: string;
  look_fors: string;
}

export interface ActivityMetadata {
  activity: string;
  activity_type: string;
  activity_title: string;
  pacing: string;
  alignment: string;
  when: string;
  focus: string;
  assignment_modality: string;
  about_the_activity_student: string;
  about_the_activity_teacher: string;
  assignment_outcome: string;
  assignment_group: string;
  progressive_assignment_group: string;
  total_points: string;
  rubric_id: string;
  assignment_method: string;
  texts: string;
  textsAsMaterialIds?: string[];
}

export interface MaterialReferences {
  materials: MaterialReference[];
}

export interface MaterialReference {
  id: string;
  accessType: string;
  locations: string[];
  resolvedMaterial?: MaterialDocument;
}

export interface StudentContent {
  content: string;
}

export interface TeacherContent {
  content: string;
}

export interface Activity {
  metadata: ActivityMetadata;
  materials: MaterialReference[];
  studentContents: StudentContent[];
  teacherContents: TeacherContent[];
}

export interface OdellDocument {
  metadata: DocumentMetadata;
  activities: Activity[];
}

export type MetadataTableType = "document" | "activity" | "materials";

export interface MetadataTable {
  metadata: DocumentMetadata | ActivityMetadata | MaterialReferences;
  type: MetadataTableType;
}

export interface MaterialMetadata {
  identifier: string;
  title: string;
  material_type:
    | "unit"
    | "text"
    | "progressive"
    | "attachment"
    | "assignment"
    | "assessment";
  grade: string;
  audience: "teacher" | "student";
  access: "external" | "link" | "attached";
  link: string;
  guidebook_type: string;
}

export interface MaterialContent {
  content: string;
}

export interface MaterialDocument {
  documentId: string;
  metadata: MaterialMetadata;
  content: MaterialContent;
}
