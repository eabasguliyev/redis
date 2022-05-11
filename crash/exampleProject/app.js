// 3rd part modules
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const Redis = require("redis");

const redisClient = Redis.createClient({ url: "redis://127.0.0.1:6379" });
redisClient.connect();

const DEFAULT_EXPIRATION = 3600;

const app = express();

app.use(cors());
// app.use(express.urlencoded({ extended: true }));

app.get("/photos", async (req, res, next) => {
  const photos = await getOrSetCache(
    `photos?albumId=${req.query.albumId}`,
    async () => {
      const albumId = req.query.albumId;

      const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
      );

      return data;
    }
  );

  res.json(photos);
});

app.get("/photos/:id", async (req, res, next) => {
  const photo = await getOrSetCache(`photos/${req.params.id}`, async () => {
    const { data } = await axios.get(
      `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    );

    return data;
  });

  res.json(photo);
});

function getOrSetCache(key, cb) {
  return new Promise(async (resolve, reject) => {
    const cacheData = await redisClient.get(key);

    console.log(cacheData);
    if (cacheData) {
      return resolve(JSON.parse(cacheData));
    }

    const freshData = await cb();

    redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData));

    resolve(freshData);
  });
}

app.listen(3000);
