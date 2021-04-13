import type {
  Session,
  Course,
  CourseWork,
  GenericObject,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Topic
} from "src/types";
import { google } from "googleapis";
import { omit } from "lodash";
import { getAccessToken } from "src/authUtils";

let googleClassroom = async (session: Session) => {
  let auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  let accessToken = await getAccessToken(session.user);
  auth.setCredentials({ access_token: accessToken });
  return google.classroom({ version: "v1", auth });
};

export let listCourses = async (session: Session): Promise<Course[]> => {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.list();
  return resp.data.courses || [];
};

export let createCourse = async (session: Session, course: Course): Promise<Course> => {
  let classroom = await googleClassroom(session);
  let resp: GenericObject;
  try {
    resp = await classroom.courses.update({ id: course.id, requestBody: course });
    return resp.data;
  } catch (err) {
    resp = await classroom.courses.create({ requestBody: course });
    return resp.data;
  }
};

export let createMaterial = async (
  session: Session,
  courseId: string,
  coursework: CourseWorkMaterial
): Promise<CourseWorkMaterial> => {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.courseWorkMaterials.create({
    courseId: courseId,
    requestBody: omit(coursework, "type", "topic")
  });
  return resp.data;
};

export let createAssignment = async (
  session: Session,
  courseId: string,
  coursework: CourseWorkAssignment
): Promise<CourseWorkAssignment> => {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.courseWork.create({
    courseId: courseId,
    requestBody: omit(coursework, "type", "topic")
  });
  return resp.data;
};

export let createTopics = async (
  session: Session,
  courseId: string,
  topics: Topic[]
): Promise<Topic[]> => {
  let classroom = await googleClassroom(session);

  let newTopics = await Promise.all(
    topics.map(async (topic) => {
      let resp = await classroom.courses.topics.create({
        courseId: courseId,
        requestBody: { courseId, name: topic.name }
      });
      return resp.data;
    })
  );

  return newTopics;
};

export let listAssignments = async (session: Session, { courseId }): Promise<CourseWork[]> => {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.courseWork.list({
    courseId,
    courseWorkStates: ["PUBLISHED", "DRAFT"]
  });
  return resp.data.courseWork || [];
};
