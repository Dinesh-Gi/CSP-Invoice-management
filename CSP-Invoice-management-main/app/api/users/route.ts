import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";

const ALLOWED_ROLES = [
  "ADMIN",
  "FINANCE",
  "SALES",
  "MANAGEMENT",
  "VIEWER",
];

async function requireAdmin() {
  const session = await getSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (session.role !== "ADMIN") {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Administrator access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();

    if (!auth.session) {
      return auth.response;
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to load users.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth.session) {
      return auth.response;
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const role =
      typeof body.role === "string"
        ? body.role.trim().toUpperCase()
        : "VIEWER";

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid user role.",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: { email },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const passwordHash =
      await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully.",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create user.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdmin();

    if (!auth.session) {
      return auth.response;
    }

    const body = await request.json();

    const id = Number(body.id);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid user ID is required.",
        },
        { status: 400 }
      );
    }

    const existingUser =
      await prisma.user.findUnique({
        where: { id },
      });

    if (!existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const data: {
      name?: string;
      email?: string;
      role?: string;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (typeof body.name === "string") {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            message: "Name cannot be empty.",
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (typeof body.email === "string") {
      const email = body.email
        .trim()
        .toLowerCase();

      if (!email) {
        return NextResponse.json(
          {
            success: false,
            message: "Email cannot be empty.",
          },
          { status: 400 }
        );
      }

      const emailOwner =
        await prisma.user.findUnique({
          where: { email },
        });

      if (emailOwner && emailOwner.id !== id) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Another user already uses this email.",
          },
          { status: 409 }
        );
      }

      data.email = email;
    }

    if (typeof body.role === "string") {
      const role =
        body.role.trim().toUpperCase();

      if (!ALLOWED_ROLES.includes(role)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid user role.",
          },
          { status: 400 }
        );
      }

      data.role = role;
    }

    if (typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }

    if (typeof body.password === "string") {
      if (body.password.length < 8) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Password must contain at least 8 characters.",
          },
          { status: 400 }
        );
      }

      data.passwordHash =
        await bcrypt.hash(
          body.password,
          12
        );
    }

    const updatedUser =
      await prisma.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      message: "User updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update user.",
      },
      { status: 500 }
    );
  }
}