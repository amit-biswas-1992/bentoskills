import { Column, Entity, Index } from "typeorm";
import { Base } from "./base.entity";

export type SkillCategory =
  | "accessibility"
  | "critique"
  | "copy"
  | "handoff"
  | "research"
  | "system";

@Entity("skill")
@Index("idx_skill_featured", ["featured"], { where: `"featured" = true` })
@Index("idx_skill_deleted", ["deletedAt"], { where: `"deletedAt" IS NULL` })
export class Skill extends Base {
  @Index({ unique: true })
  @Column({ type: "text" })
  slug!: string;

  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text" })
  tagline!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "text" })
  version!: string;

  @Column({ type: "text" })
  author!: string;

  @Column({ type: "text" })
  repoUrl!: string;

  @Column({ type: "text", nullable: true })
  homepageUrl!: string | null;

  @Column({ type: "text", nullable: true })
  licenseSpdx!: string | null;

  @Index()
  @Column({ type: "text" })
  category!: SkillCategory;

  @Column({ type: "text", array: true, default: () => "'{}'" })
  tags!: string[];

  @Column({ type: "int", default: 0 })
  installCount!: number;

  @Column({ type: "int", default: 0 })
  favoriteCount!: number;

  @Column({ type: "boolean", default: false })
  featured!: boolean;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  lastSyncedAt!: Date | null;

  @Column({ type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
