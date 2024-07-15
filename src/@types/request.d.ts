import "express";
import { UserInterface } from "../model/user";

declare module "express" {
  interface Request {
    user?: UserInterface;
    token?: object;
  }
}
