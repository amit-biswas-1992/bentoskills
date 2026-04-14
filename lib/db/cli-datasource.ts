import "reflect-metadata";
import { config } from "dotenv";
config({ path: ".env.local" });

import { getDataSource } from "./data-source";

export default getDataSource();
