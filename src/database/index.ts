import { connect } from "mongoose";
import { Redis } from "ioredis";

/**
 * @param uri mongodb
 * @returns connection state
 */
const mongodb = async (uri: string): Promise<number | null> => {
  try {
    const { connection } = await connect(uri);
    return connection.readyState;
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    return null;
  }
};

declare global {
  var redis: Redis | undefined;
}

const createRedisClient = () => {
  const redis = new Redis("redis://127.0.0.1:6379", {
    retryStrategy: () => null,
  });

  redis.on("connect", () => {
    console.log("Redis connection success!");
  });

  redis.on("error", (error: Error) => {
    console.error("Redis connection error!", error.message);

    if (!globalThis.redis) {
      console.error("Exiting due to initial Redis connection failure!\n");
      process.exit(1);
    }
  });

  redis.on("close", () => {
    console.log("Redis connection closed! Retrying in 15 seconds...");

    setTimeout(() => {
      globalThis.redis = createRedisClient();
    }, 15000);
  });

  return redis;
};

globalThis.redis = globalThis.redis ?? createRedisClient();

/**
 * @returns redis instance
 */
const redis = globalThis.redis;

export { mongodb, redis };
