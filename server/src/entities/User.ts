import { Entity, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
export class User {
  @PrimaryKey()
  id!: number;

  @Property({ unique: true })
  username!: string;

  @Property({ unique: true })
  email!: string;

  @Property()
  password!: string;

  @Property({ type: "date" })
  createdAt?: Date = new Date();

  @Property({ type: "date", onUpdate: () => new Date() })
  updatedAt?: Date = new Date();
}
