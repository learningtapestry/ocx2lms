import { NextApiRequest, NextApiResponse } from "next";
import { getSession } from "next-auth/client";
import { listAssignments } from "src/classroom";
import { logError } from "src/utils";
import protectedRoute from "src/protectedRoute";

export default protectedRoute(async (req: NextApiRequest, res: NextApiResponse) => {
  let session = await getSession({ req });
  let params = req.body;
  try {
    let assignments = await listAssignments(session, params);
    res.status(200).json({ assignments });
  } catch (err) {
    logError(err);
    res.status(422).json({ error: "Failed to fetch assignments" });
  }
});
