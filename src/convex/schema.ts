import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // ============================================================
    // Binário Poético — form submission inbox
    // ============================================================
    // Read is fully PUBLIC per product decision (any panel can list
    // submissions).  Mutations are PUBLIC BY DEFAULT in dev so workers
    // can assign / archive / delete without going through Convex Auth.
    // Future hardening: re-enable `checkAdmin` and add a roster.
    formSubmissions: defineTable({
      name: v.string(),
      phone: v.string(),
      email: v.string(),
      marca: v.string(),
      modelo: v.string(),
      mensagem: v.string(),
      status: v.union(
        v.literal("new"),
        v.literal("read"),
        v.literal("archived"),
      ),
      notes: v.optional(v.string()),
      source: v.optional(v.string()),
      // Employee / collaborator who "took care" of the request
      assignedTo: v.optional(v.string()),
      attendedAt: v.optional(v.number()),
      // unix ms
      createdAt: v.number(),
      updatedAt: v.number(),
    })
      .index("by_status_createdAt", ["status", "createdAt"])
      .index("by_email", ["email"])
      .index("by_assignedTo", ["assignedTo"])
      .index("by_createdAt", ["createdAt"]),

    // add other tables here

    // tableName: defineTable({
    //   ...
    //   // table fields
    // }).index("by_field", ["field"])
  },
  {
    schemaValidation: false,
  },
);

export default schema;
