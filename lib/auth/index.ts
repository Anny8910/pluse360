import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { account, session, users, verification } from "@/db/schema";

export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    // Better Auth model names are singular by default ("user", "session",
    // "account", "verification"). We map the "user" model to our existing
    // users table so auth and profile live in one row. `camelCase: true`
    // makes field resolution match our camelCase Drizzle property names.
    schema: { user: users, session, account, verification },
    camelCase: true,
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: true, input: false, returned: true },
      organizationId: {
        type: "string",
        required: true,
        input: false,
        returned: true,
      },
      departmentId: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
      teamId: { type: "string", required: false, input: false, returned: true },
      managerId: {
        type: "string",
        required: false,
        input: false,
        returned: true,
      },
      jobTitle: { type: "string", required: false, input: false, returned: true },
      location: { type: "string", required: false, input: false, returned: true },
    },
  },
  advanced: {
    database: { generateId: "uuid" },
  },
  plugins: [nextCookies()],
});
