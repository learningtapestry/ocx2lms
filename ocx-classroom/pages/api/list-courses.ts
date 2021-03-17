import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { listCourses } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let session = await getSession({ req });
  try {
    let courses = await listCourses(session);
    res.status(200).json({ courses });
  } catch (err) {
    logError(err);
    res.status(422).json({ error: "Failed to fetch courses" });
  }
});
