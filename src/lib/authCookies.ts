import { destroyCookie } from "nookies";

export const ACCESS_TOKEN_COOKIE = "CLIMB_ACCESS_TOKEN";
export const REFRESH_TOKEN_COOKIE = "CLIMB_REFRESH_TOKEN";

const LEGACY_AUTH_COOKIES = ["@CLIMB:T", "@CLIMB:R", "@CLIMB:RT"] as const;

export const clearLegacyAuthStorage = () => {
  LEGACY_AUTH_COOKIES.forEach((cookieName) => {
    destroyCookie(undefined, cookieName, { path: "/" });
  });

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("@CLIMB:T");
  }
};
