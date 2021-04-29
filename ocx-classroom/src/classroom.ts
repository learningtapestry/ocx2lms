import type {
  Session,
  Course,
  GenericObject,
  CourseWorkMaterial,
  CourseWorkAssignment,
  Topic
} from "src/types";
import { google } from "googleapis";
import { omit } from "lodash";
import { getAccessToken } from "src/authUtils";

async function googleClassroom(session: Session) {
  let auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  let accessToken = await getAccessToken(session.user);
  auth.setCredentials({ access_token: accessToken });
  return google.classroom({ version: "v1", auth });
}

export async function createCourse(session: Session, course: Course): Promise<Course> {
  let classroom = await googleClassroom(session);
  let resp: GenericObject;
  try {
    resp = await classroom.courses.update({ id: course.id, requestBody: course });
    return resp.data;
  } catch (err) {
    resp = await classroom.courses.create({ requestBody: course });
    return resp.data;
  }
}

export async function createMaterial(
  session: Session,
  courseId: string,
  coursework: CourseWorkMaterial
): Promise<CourseWorkMaterial> {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.courseWorkMaterials.create({
    courseId: courseId,
    requestBody: omit(coursework, "type", "topic", "ocxGdoc")
  });
  return resp.data;
}

export async function createAssignment(
  session: Session,
  courseId: string,
  coursework: CourseWorkAssignment,
  tries: number = 0
): Promise<CourseWorkAssignment> {
  let classroom = await googleClassroom(session);
  try {
    let resp = await classroom.courses.courseWork.create({
      courseId: courseId,
      requestBody: omit(coursework, "type", "topic", "timeRequired", "lessonActivity")
    });
    return resp.data;
  } catch (err) {
    if (err.response.code === 502 && tries < 3) {
      return await createAssignment(session, courseId, coursework, tries + 1);
    }
    throw err;
  }
}

export async function createTopics(
  session: Session,
  courseId: string,
  topics: Topic[]
): Promise<Topic[]> {
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
}
