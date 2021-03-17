import { NextApiRequest, NextApiResponse } from "next/types";
import { getSession } from "next-auth/client";

type RouteHandler = (req: NextApiRequest, res: NextApiResponse) => Promise<any>;

const protectedRoute = (handler: RouteHandler) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const session = await getSession({ req });
    if (session) {
      handler(req, res);
    } else {
      res.status(401).send("Not authorized");
      // throw new Error("Not authorized");
    }
  };
};

export default protectedRoute;
