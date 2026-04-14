import "reflect-metadata";
import { config } from "dotenv";
config({ path: ".env.local" });
import ds from "./cli-datasource";

async function main() {
  const cmd = process.argv[2];
  await ds.initialize();

  switch (cmd) {
    case "migrate":
      await ds.runMigrations();
      console.log("migrations applied");
      break;
    case "revert":
      await ds.undoLastMigration();
      console.log("last migration reverted");
      break;
    case "generate": {
      const name = process.argv[3];
      if (!name) throw new Error("usage: pnpm db:generate <Name>");
      console.log(`run: pnpm typeorm migration:generate lib/db/migrations/${name} -d lib/db/data-source.ts`);
      break;
    }
    default:
      throw new Error(`unknown command: ${cmd}`);
  }
  await ds.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
