import { Column, Entity, Index } from "typeorm";
import { Base } from "./base.entity";

@Entity("user")
export class User extends Base {
  @Index({ unique: true })
  @Column({ type: "bigint" })
  githubId!: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  username!: string;

  @Column({ type: "text", nullable: true })
  name!: string | null;

  @Column({ type: "text", nullable: true })
  avatarUrl!: string | null;

  @Column({ type: "text", nullable: true })
  email!: string | null;
}
