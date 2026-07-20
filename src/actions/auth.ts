"use server";

import { auth } from "@/lib/auth";
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from "@/validations/auth";
import { cookies, headers } from "next/headers";

export type AuthActionResult = {
  success: boolean;
  error?: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
  };
};

async function setCookiesFromResponse(response: Response) {
  const setCookieHeaders = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [];
  const rawCookieHeader = response.headers.get("set-cookie");
  const cookieStrings = setCookieHeaders.length > 0
    ? setCookieHeaders
    : rawCookieHeader
      ? rawCookieHeader.split(/,(?=\s*[a-zA-Z0-9_-]+\s*=)/)
      : [];

  const cookieStore = await cookies();
  for (const cookieString of cookieStrings) {
    const parts = cookieString.split(";").map((p) => p.trim());
    if (parts.length === 0) continue;
    const [nameValue, ...attributes] = parts;
    const equalsIdx = nameValue.indexOf("=");
    if (equalsIdx === -1) continue;
    const name = nameValue.substring(0, equalsIdx).trim();
    const value = decodeURIComponent(nameValue.substring(equalsIdx + 1).trim());

    const cookieOptions: {
      path?: string;
      domain?: string;
      maxAge?: number;
      expires?: Date;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
    } = {};

    for (const attr of attributes) {
      const lower = attr.toLowerCase();
      if (lower === "httponly") cookieOptions.httpOnly = true;
      else if (lower === "secure") cookieOptions.secure = true;
      else if (lower.startsWith("path=")) cookieOptions.path = attr.substring(5).trim();
      else if (lower.startsWith("domain=")) cookieOptions.domain = attr.substring(7).trim();
      else if (lower.startsWith("max-age=")) {
        const maxAge = parseInt(attr.substring(8).trim(), 10);
        if (!isNaN(maxAge)) cookieOptions.maxAge = maxAge;
      }
      else if (lower.startsWith("expires=")) {
        const date = new Date(attr.substring(8).trim());
        if (!isNaN(date.getTime())) cookieOptions.expires = date;
      }
      else if (lower.startsWith("samesite=")) {
        const sameSiteVal = attr.substring(9).trim().toLowerCase();
        if (sameSiteVal === "lax" || sameSiteVal === "strict" || sameSiteVal === "none") {
          cookieOptions.sameSite = sameSiteVal as "lax" | "strict" | "none";
        }
      }
    }
    cookieStore.set(name, value, cookieOptions);
  }
}

export async function loginAction(input: LoginInput): Promise<AuthActionResult> {
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const reqHeaders = await headers();
    const response = await auth.api.signInEmail({
      body: {
        email: validation.data.email,
        password: validation.data.password,
      },
      headers: reqHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errorData?.message ||
          errorData?.error?.message ||
          "Invalid email or password. Please verify your credentials and try again.",
      };
    }

    await setCookiesFromResponse(response);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during authentication.",
    };
  }
}

export async function signupAction(input: SignupInput): Promise<AuthActionResult> {
  const validation = signupSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.flatten().fieldErrors,
    };
  }

  try {
    const reqHeaders = await headers();
    const response = await auth.api.signUpEmail({
      body: {
        name: validation.data.name,
        email: validation.data.email,
        password: validation.data.password,
      },
      headers: reqHeaders,
      asResponse: true,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        success: false,
        error:
          errorData?.message ||
          errorData?.error?.message ||
          "Could not create account. An account with this email might already exist.",
      };
    }

    await setCookiesFromResponse(response);
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred while creating your account.",
    };
  }
}
