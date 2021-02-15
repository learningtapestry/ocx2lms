import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { createCourse } from "src/classroom";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });
  const course = req.body;
  try {
    const created = await createCourse(session, course);
    res.status(200).json(created);
  } catch (err) {
    err.errors?.forEach(({ message }) => {
      console.log(message);
    });
    res.status(422).json({ error: "Failed to create course" });
  }
};
