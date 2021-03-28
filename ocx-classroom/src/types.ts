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
  // courseId: string
  // id: string
  // title: string
  // description: string
  // materials: classroom_v1.Schema$Material[]
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

interface Material extends classroom_v1.Schema$Material {}

interface ClassroomData {
  course: Course;
  courseworks: (CourseWorkAssignment | CourseWorkMaterial)[];
}

export type {
  AuthPayload,
  Session,
  User,
  Course,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Material,
  GenericObject,
  ClassroomData
};
