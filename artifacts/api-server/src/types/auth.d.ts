// @ts-nocheck
import type { TokenUser } from "../middleware/auth";

declare global {
  namespace Express {
    interface Request {
      tokenUser?: TokenUser;
    }
  }
}
