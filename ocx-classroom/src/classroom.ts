import type { Session, Course, CourseWork } from "src/types";
import { google } from "googleapis";
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
  let resp = await classroom.courses.create({ requestBody: course });
  return resp.data;
};

export let listAssignments = async (session: Session, { courseId }): Promise<CourseWork[]> => {
  let classroom = await googleClassroom(session);
  let resp = await classroom.courses.courseWork.list({
    courseId,
    courseWorkStates: ["PUBLISHED", "DRAFT"]
  });
  return resp.data.courseWork || [];
};
