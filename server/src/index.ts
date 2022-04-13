require("dotenv").config();

import { MikroORM } from "@mikro-orm/core";
import { EntityManager } from "@mikro-orm/postgresql";
import bcrypt from "bcrypt";
import bodyParser from "body-parser";
import connectRedis from "connect-redis";
import cors from "cors";
import express from "express";
import session from "express-session";
import { StatusCodes } from "http-status-codes";
import { createClient } from "redis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import mikroOrmConfig from "./mikro-orm.config";

declare module "express-session" {
  export interface SessionData {
    userId: number;
  }
}

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  const RedisStore = connectRedis(session);
  let redisClient = createClient({ legacyMode: true });

  // there's unexpected behavior (internal server error) when this code removed
  redisClient.connect().catch((err) => console.log(err));

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redisClient as any,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: "lax", // csrf
        secure: __prod__, // cookie only works in https
      },
      secret: process.env.SESSION_SECRET_KEY!,
      saveUninitialized: false,
      resave: false,
    })
  );

  app.get("/", (_, res) => {
    res.send("Hello world");
  });

  app.get("/api/posts", async (_, res) => {
    const posts = await orm.em.find(Post, {});

    if (posts.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "posts is not found",
      });
    }

    return res.status(StatusCodes.ACCEPTED).json(posts);
  });

  app.get("/api/posts/:post_id", async (req, res) => {
    const post = await orm.em.findOne(Post, {
      id: Number(req.params["post_id"]),
    });

    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "posts is not found",
      });
    }

    return res.status(StatusCodes.ACCEPTED).json(post);
  });

  app.post("/api/posts", async (req, res) => {
    const post = orm.em.create(Post, {
      title: req.body.title,
    });

    await orm.em.persistAndFlush(post);
    return res.status(StatusCodes.CREATED).json(post);
  });

  app.patch("/api/posts/:post_id", async (req, res) => {
    const post = await orm.em.findOne(Post, {
      id: Number(req.params["post_id"]),
    });
    if (!post) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "posts is not found",
      });
    }

    post.title = req.body.title;
    await orm.em.persistAndFlush(post);
    return res.status(StatusCodes.ACCEPTED).json(post);
  });

  app.delete("/api/posts/:post_id", async (req, res) => {
    await orm.em.nativeDelete(Post, { id: Number(req.params["post_id"]) });
    return res.status(StatusCodes.ACCEPTED).json({
      message: "success deleted the post",
    });
  });

  app.post("/api/users/register", async (req, res) => {
    const { username, email, password } = req.body;
    if (username.length < 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: {
          field: "username",
          message: "the username is too short",
        },
      });
    }

    if (password.length < 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error: {
          field: "password",
          message: "the password is not strong enough",
        },
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    let user;
    try {
      // await orm.em.persistAndFlush(user);
      const result = await (orm.em as EntityManager)
        .createQueryBuilder(User)
        .getKnexQuery()
        .insert({
          username,
          email,
          password: hashedPassword,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning("*");
      user = result[0];
    } catch (err) {
      // err code 23505 means column value already exists
      if (err.code === "23505") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: {
            field: "username or email",
            message: "the username or email is already exists",
          },
        });
      }
    }

    const { id, createdAt, updatedAt } = user;
    return res
      .status(StatusCodes.CREATED)
      .json({ id, username, email, createdAt, updatedAt });
  });

  app.post("/api/users/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await orm.em.findOne(User, { username });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: {
          field: "username",
          message: "that username does'nt exist",
        },
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: {
          field: "password",
          message: "invalid password",
        },
      });
    }

    const { id, email, createdAt, updatedAt } = user;
    req.session.userId = id;

    return res
      .status(StatusCodes.ACCEPTED)
      .json({ id, username, email, createdAt, updatedAt });
  });

  app.post("/api/users/logout", (req, res) => {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);

          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ message: "failed to destroy the cookie" });
          return resolve(err);
        }

        res
          .status(StatusCodes.ACCEPTED)
          .json({ message: "success to destroy the cookie" });
        resolve(true);
      })
    );
  });

  app.get("/api/users", async (req, res) => {
    const { userId } = req.session;
    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "you are not logged in",
      });
    }

    const user = await orm.em.findOne(User, { id: userId });
    const { id, username, email, createdAt, updatedAt } = user!;
    return res
      .status(StatusCodes.ACCEPTED)
      .json({ id, username, email, createdAt, updatedAt });
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.log(err);
});
