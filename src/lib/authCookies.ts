import { destroyCookie, setCookie } from "nookies";

export const ACCESS_TOKEN_COOKIE = "CLIMB_ACCESS_TOKEN";
export const REFRESH_TOKEN_COOKIE = "CLIMB_REFRESH_TOKEN";
export const REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const LEGACY_AUTH_COOKIES = ["@CLIMB:T", "@CLIMB:R", "@CLIMB:RT"] as const;

const isSecureContext = () =>
  typeof window !== "undefined" && window.location.protocol === "https:";

export const expirationMillisecondsToSeconds = (expiresIn: number) =>
  Math.max(1, Math.ceil(expiresIn / 1000));

export const saveAccessToken = (accessToken: string, expiresIn: number) => {
  setCookie(undefined, ACCESS_TOKEN_COOKIE, accessToken, {
    maxAge: expirationMillisecondsToSeconds(expiresIn),
    path: "/",
    secure: isSecureContext(),
    sameSite: "strict",
  });
};

export const saveRefreshToken = (refreshToken: string) => {
  setCookie(undefined, REFRESH_TOKEN_COOKIE, refreshToken, {
    maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    secure: isSecureContext(),
    sameSite: "strict",
  });
};

export const clearAuthCookies = () => {
  destroyCookie(undefined, ACCESS_TOKEN_COOKIE, { path: "/" });
  destroyCookie(undefined, REFRESH_TOKEN_COOKIE, { path: "/" });
};

export const clearLegacyAuthStorage = () => {
  LEGACY_AUTH_COOKIES.forEach((cookieName) => {
    destroyCookie(undefined, cookieName, { path: "/" });
  });

  if (typeof window !== "undefined") {
    window.localStorage.removeItem("@CLIMB:T");
  }
};
