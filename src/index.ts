import { MikroORM } from "@mikro-orm/core";
import bodyParser from "body-parser";
import express from "express";
import { Post } from "./entities/Post";
import mikroOrmConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroOrmConfig);
  await orm.getMigrator().up();

  const app = express();

  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.get("/", (_, res) => {
    res.send("Hello world");
  });

  app.get("/api/posts", async (_, res) => {
    const posts = await orm.em.find(Post, {});

    if (posts.length === 0) {
      return res.status(404).json({
        message: "posts is not found",
      });
    }

    return res.status(200).json(posts);
  });

  app.get("/api/posts/:post_id", async (req, res) => {
    const post = await orm.em.findOne(Post, {
      id: Number(req.params["post_id"]),
    });

    if (!post) {
      return res.status(404).json({
        message: "posts is not found",
      });
    }

    return res.status(200).json(post);
  });

  app.post("/api/posts", async (req, res) => {
    const post = orm.em.create(Post, {
      title: req.body.title,
    });

    await orm.em.persistAndFlush(post);
    return res.status(200).json(post);
  });

  app.patch("/api/posts/:post_id", async (req, res) => {
    const post = await orm.em.findOne(Post, {
      id: Number(req.params["post_id"]),
    });
    if (!post) {
      return res.status(404).json({
        message: "posts is not found",
      });
    }

    post.title = req.body.title;
    await orm.em.persistAndFlush(post);
    return res.status(200).json(post);
  });

  app.delete("/api/posts/:post_id", async (req, res) => {
    await orm.em.nativeDelete(Post, { id: Number(req.params["post_id"]) });
    return res.status(200).json({
      message: "success deleted the post",
    });
  });

  app.listen(4000, () => {
    console.log("server started on localhost:4000");
  });
};

main().catch((err) => {
  console.log(err);
});
