import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type InstallSource = "web" | "cli";

@Entity("install_log")
@Index("idx_install_skill_created", ["skillId", "createdAt"])
export class InstallLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  userId!: string | null;

  @Column({ type: "uuid" })
  skillId!: string;

  @Column({ type: "text" })
  source!: InstallSource;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
