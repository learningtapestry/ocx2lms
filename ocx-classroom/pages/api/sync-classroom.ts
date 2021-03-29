import { omit } from "lodash";
import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { createCourse } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";
import { ClassroomData } from "src/types";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let session = await getSession({ req });
  let data: ClassroomData = req.body;

  try {
    let course = { ...omit(data.course, "type"), ownerId: "me", courseState: "PROVISIONED" };
    let created = await createCourse(session, course); // TODO: handle update
    res.status(200).json(created);
    // TODO: process coursework
  } catch (err) {
    logError(err);
    let msgs = err.errors?.map((e) => e.message);
    res.status(422).json({ error: msgs || "Failed to sync data" });
  }
});
