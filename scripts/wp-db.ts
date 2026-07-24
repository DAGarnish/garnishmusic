import mysql from "mysql2/promise";

export const WP_DB_CONFIG = {
  host: "127.0.0.1",
  port: 3307,
  user: "garnishmusicprod_xzghkquntn",
  password: "hb9CpnPJTP",
  database: "garnishmusicprod_xzghkquntn",
};

export const BASE_PREFIX = "D0QbVivoEg_";

export function tablePrefixForBlog(blogId: number): string {
  return blogId === 1 ? BASE_PREFIX : `${BASE_PREFIX}${blogId}_`;
}

export async function getWpConnection() {
  return mysql.createConnection(WP_DB_CONFIG);
}
