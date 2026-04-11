import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("account")
@Index(["provider", "providerAccountId"], { unique: true })
export class Account {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "text" })
  type!: string;

  @Column({ type: "text" })
  provider!: string;

  @Column({ type: "text" })
  providerAccountId!: string;

  @Column({ type: "text", nullable: true })
  refresh_token!: string | null;

  @Column({ type: "text", nullable: true })
  access_token!: string | null;

  @Column({ type: "bigint", nullable: true })
  expires_at!: string | null;

  @Column({ type: "text", nullable: true })
  token_type!: string | null;

  @Column({ type: "text", nullable: true })
  scope!: string | null;

  @Column({ type: "text", nullable: true })
  id_token!: string | null;

  @Column({ type: "text", nullable: true })
  session_state!: string | null;
}
