import { NextApiRequest, NextApiResponse } from "next/types";
import { getSession } from "next-auth/client";

type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any>;

export default function protectedRoute(handler: RouteHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let session = await getSession({ req });
    if (session) {
      handler(req, res);
    } else {
      res.status(401).send("Not authorized");
    }
  };
}
