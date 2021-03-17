import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { listAssignments } from "src/classroom";
import protectedRoute from "src/protectedRoute";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  const session = await getSession({ req });
  const params = req.body;
  try {
    const assignments = await listAssignments(session, params);
    res.status(200).json({ assignments });
  } catch (err) {
    console.log(err);
    err.errors?.forEach(({ message }) => {
      console.log(message);
    });
    res.status(422).json({ error: "Failed to fetch assignments" });
  }
});
