import { omit } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { createAssignment, createCourse, createMaterial, createTopics } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";
import { ClassroomData, CourseWork, Material, Session } from "src/types";
import { createFolder, htmlToGoogleDoc } from "src/drive";

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

    let folderId = await createFolder(session, `Classroom-${course.name}`);
    let courseworks = await Promise.all(
      data.courseworks.map(async (c) => await courseworkWithDocs(session, c, folderId))
    );

    for (let i = 0; i < courseworks.length; i++) {
      let cw = courseworks[i];
      let topic = topics.find((t) => cw.topic && t.name === cw.topic);
      if (topic) {
        cw.topicId = topic.topicId;
      }
      try {
        if (cw.type == "Material") {
          await createMaterial(session, courseId, cw);
        } else {
          await createAssignment(session, courseId, cw);
        }
      } catch (err) {
        console.log("Err sync:", [cw.type, cw.id, cw.title].join(" :: "));
        console.log(err);
      }
    }
    res.status(200).json(created);
  } catch (err) {
    logError(err);
    let msg = err.message || err.errors?.map((e) => e.message)?.join(", ");
    res.status(422).json({ error: msg || "Failed to sync data" });
  }
});

async function courseworkWithDocs(
  session: Session,
  cw: CourseWork,
  folderId: string
): Promise<CourseWork> {
  let materials: Material[] = [];
  for (let i = 0; i < cw.materials.length; i++) {
    let material: Material = cw.materials[i];
    if (material.ocxGdoc) {
      let { content, shareMode } = material.ocxGdoc;
      try {
        let id = await htmlToGoogleDoc(session, folderId, cw.title, content);
        materials.push({ driveFile: { driveFile: { id }, shareMode } });
      } catch (err) {
        console.log("Error gen doc:", [cw.type, cw.id, cw.title].join(" :: "));
        logError(err);
      }
    } else {
      materials.push(material);
    }
  }
  return { ...cw, materials };
}
