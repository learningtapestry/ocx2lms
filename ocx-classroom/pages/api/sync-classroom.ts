import { omit } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { createAssignment, createCourse, createMaterial, createTopics } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";
import { ClassroomData } from "src/types";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let session = await getSession({ req });
  let data: ClassroomData = req.body;

  try {
    let course = {
      ...omit(data.course, "type"),
      ownerId: "me",
      courseState: "PROVISIONED"
    };
    let created = await createCourse(session, course);
    let courseId = created?.id || data.course.id;
    let topics = await createTopics(session, courseId, data.topics);
    data.courseworks.forEach(async (coursework) => {
      // TODO: handle individual sync failures
      let topic = topics.find((t) => coursework.topic && t.name === coursework.topic);
      if (topic) {
        coursework.topicId = topic.topicId;
      }
      try {
        if (coursework.type == "Material") {
          await createMaterial(session, courseId, coursework);
        } else {
          await createAssignment(session, courseId, coursework);
        }
      } catch (err) {
        logError(err);
      }
    });
    res.status(200).json(created);
  } catch (err) {
    logError(err);
    let msg = err.message || err.errors?.map((e) => e.message)?.join(", ");
    res.status(422).json({ error: msg || "Failed to sync data" });
  }
});
