import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env"
    );
  }

  if (password.length < 8) {
    throw new Error("Admin password must contain at least 8 characters.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        name,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log(`Admin user updated: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    console.log(`Admin user created: ${email}`);
  }
}

main()
  .catch((error) => {
    console.error("Admin creation failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });