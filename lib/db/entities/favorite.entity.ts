import { CreateDateColumn, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("favorite")
export class Favorite {
  @PrimaryColumn({ type: "uuid" })
  userId!: string;

  @Index()
  @PrimaryColumn({ type: "uuid" })
  skillId!: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
