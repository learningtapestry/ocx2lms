import type { Session, Course } from "src/types";
import { google } from "googleapis";
import { getAccessToken } from "src/authUtils";

export const googleClassroom = async (session: Session) => {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  const accessToken = await getAccessToken(session.user);
  auth.setCredentials({
    access_token: accessToken
  });
  return google.classroom({ version: "v1", auth });
};

export const listCourses = async (session: Session): Promise<Course[]> => {
  const classroom = await googleClassroom(session);
  return classroom.courses.list().then((r) => r.data.courses || []);
};
