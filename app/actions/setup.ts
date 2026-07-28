"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { setupAdminSchema } from "@/lib/validations";

export async function getSetupStatus() {
  const userCount = await prisma.user.count();
  return { needsSetup: userCount === 0 };
}

/**
 * Creates the very first admin login. Deliberately has no requireAuth()
 * guard — this runs before any account exists, so there's no session to
 * check. Safety instead comes from the transaction re-checking the user
 * count is still zero immediately before inserting, so this can only ever
 * succeed once: the first call to complete the transaction wins, and every
 * later call (from this page or anyone who finds the URL) fails.
 */
export async function createFirstAdmin(input: unknown) {
  const { email, password } = setupAdminSchema.parse(input);
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.$transaction(async (tx) => {
    const userCount = await tx.user.count();
    if (userCount > 0) {
      throw new Error("Setup has already been completed.");
    }

    return tx.user.create({
      data: { email, password: passwordHash, name: "Admin" },
    });
  });
}
