import { D1Database, KVNamespace } from "@cloudflare/workers-types";
import dayjs from "dayjs";
import { Context } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

export interface Bindings {
  ASSETS: KVNamespace;
  DB: D1Database;
}

interface Success<T> {
  type: "success";
  value: T;
}

interface Error {
  type: "error";
  message: string;
  status: ContentfulStatusCode;
}

export type Result<T> = Success<T> | Error;

export const success = <T>(value: T): Success<T> => ({
  type: "success",
  value,
});

export const error = (
  message: string,
  status: ContentfulStatusCode
): Error => ({
  type: "error",
  message,
  status,
});

export const screenNameRegexStr = "[a-z0-9_]{4,16}";

export const getIP = (c: Context) => {
  return c.req.header("CF-Connecting-IP") ?? "undefined";
};

export const isInternalIP = (ip: string) => {
  const prefixes = ["202.16.215."];
  return prefixes.some((prefix) => ip.startsWith(prefix));
};

export const getNow = () => {
  const now = dayjs().tz();
  const year = now.year();
  const month = now.month() + 1;
  const day = now.date();
  const hours = now.hour();
  return { year, month, day, hours };
};
