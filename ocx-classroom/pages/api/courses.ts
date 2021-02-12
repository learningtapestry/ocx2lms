import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { listCourses } from "src/classroom";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });
  listCourses(session)
    .then((courses) => {
      res.status(200).json({ courses });
    })
    .catch(() => {
      res.status(422).json({ error: "Failed to fetch courses" });
    });
};
