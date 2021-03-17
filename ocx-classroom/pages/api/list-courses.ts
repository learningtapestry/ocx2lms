import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { listCourses } from "src/classroom";
import protectedRoute from "src/protectedRoute";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });
  try {
    const courses = await listCourses(session);
    res.status(200).json({ courses });
  } catch (err) {
    err.errors?.forEach(({ message }) => {
      console.log(message);
    });
    res.status(422).json({ error: "Failed to fetch courses" });
  }
});
