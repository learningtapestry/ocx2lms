import type { User as SessionUser } from "next-auth";
import type { SessionBase, GenericObject } from "next-auth/_utils";
import { classroom_v1 } from "googleapis";

interface User extends SessionUser {
  id?: number | null;
}

interface Session extends SessionBase {
  user: User;
}

interface AuthPayload {
  user: User;
  accessToken: string;
  accessTokenExpires: number;
  refreshToken: string;
  error?: string;
}

interface Course extends classroom_v1.Schema$Course {
  type?: string;
}

interface CourseWorkAssignment extends classroom_v1.Schema$CourseWork {
  type?: "Assignment";
  topic?: string;
  timeRequired?: number;
  lessonActivity?: boolean;
  // courseId: string
  // id: string
  // title: string
  // description: string
  // materials: Material[]
  // state: enum (CourseWorkState)
  // alternateLink: string
  // creationTime: string
  // updateTime: string
  // dueDate: Date
  // dueTime: TimeOfDay
  // scheduledTime: string
  // maxPoints: number
  // workType: enum (CourseWorkType)
  // associatedWithDeveloper: boolean
  // assigneeMode: enum (AssigneeMode)
  // individualStudentsOptions: IndividualStudentsOptions
  // submissionModificationMode: enum (SubmissionModificationMode)
  // creatorUserId: string
  // topicId: string
  // Union fields:
  // "assignment": Assignment,
  // "multipleChoiceQuestion": MultipleChoiceQuestion,
}

interface CourseWorkMaterial extends classroom_v1.Schema$CourseWorkMaterial {
  type?: "Material";
  topic?: string;
  // courseId: string
  // id: string
  // title: string
  // description: string
  // materials: Material[]
  // state: DRAFT | PUBLISHED | DELETED
  // alternateLink: string
  // creationTime: string
  // updateTime: string
  // scheduledTime: string
  // assigneeMode: ALL_STUDENTS | INDIVIDUAL_STUDENTS
  // individualStudentsOptions: IndividualStudentsOptions[]
  // creatorUserId: string
  // topicId: string
}

type CourseWork = CourseWorkAssignment | CourseWorkMaterial;

interface Material extends classroom_v1.Schema$Material {
  ocxGdoc?: {
    content: string;
    id?: string;
    shareMode: string;
  };
}

interface ClassroomData {
  course: Course;
  courseworks: CourseWork[];
  topics: Topic[];
  rubrics: Rubric[];
}

interface Topic extends classroom_v1.Schema$Topic {}

interface Rubric extends GenericObject {}

export type {
  AuthPayload,
  Session,
  User,
  Course,
  CourseWork,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Material,
  Topic,
  Rubric,
  GenericObject,
  ClassroomData
};
