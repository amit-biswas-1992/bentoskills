import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("session")
export class Session {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "text" })
  sessionToken!: string;

  @Index()
  @Column({ type: "uuid" })
  userId!: string;

  @Column({ type: "timestamptz" })
  expires!: Date;
}
