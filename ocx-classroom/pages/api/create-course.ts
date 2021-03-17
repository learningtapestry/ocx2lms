import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { createCourse } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let session = await getSession({ req });
  let course = req.body;
  try {
    let created = await createCourse(session, course);
    res.status(200).json(created);
  } catch (err) {
    logError(err);
    res.status(422).json({ error: "Failed to create course" });
  }
});
