import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Joi from "joi";
import { generateSaltAndHash } from "../../../lib/utils";

import prisma from "../../../lib/prisma";
import { authOptions } from "../../../lib/auth";

const roleEnum = ["USER", "ADMIN"];

const schemaPATCH = Joi.object({
  userId: Joi.string().required(),
  name: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid(...roleEnum),
  image: Joi.string(),
  password: Joi.string(),
});

export const GET = async () => {
  try {
    const authValue = await getServerSession(authOptions);

    if (!authValue)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        emailVerified: true,
      },
    });
    const newUsers = users.map((user) => {
      if (user.image) {
        const image = user.image.toString("utf-8");
        return { ...user, image };
      }
      return user;
    });
    return NextResponse.json({ users: newUsers }, { status: 200 });
  } catch (error) {
    return NextResponse.error({ message: error.message }, { status: 401 });
  }
};

export const POST = async (req) => {
  try {
    const authValue = await getServerSession(authOptions);

    if (!authValue)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const { name, email, role, password, image = null } = await req.json();
    const { salt, hash } = generateSaltAndHash({ password });

    const values = { name, email, role, salt, hash };
    if (image) {
      const textBuffer = Buffer.from(image, "utf-8");
      values.image = textBuffer;
    }
    const newUser = await prisma.user.create({
      data: {
        ...values,
      },
    });
    return NextResponse.json({ user: newUser }, { status: 201 });
  } catch (error) {
    return NextResponse.error({ message: error.message }, { status: 401 });
  }
};

export const PATCH = async (req) => {
  try {
    const body = await req.json();
    const value = await schemaPATCH.validateAsync(body);

    const authValue = await getServerSession(authOptions);
    if (!authValue)
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    const { user } = authValue;
    if (!user)
      return Response.json({ message: "Unauthorized" }, { status: 401 });

    if (user.role !== "ADMIN" || user.id !== value.userId) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (user.role === "USER") {
      value.role = "USER";
    }

    const aux = {
      name: value.name,
      email: value.email,
      role: value.role,
    };

    if (value.image) {
      const textBuffer = Buffer.from(value.image, "utf-8");
      aux.image = textBuffer;
    }

    if (value.password) {
      const { salt, hash } = generateSaltAndHash({ password: value.password });
      value.salt = salt;
      value.hash = hash;
      aux.salt = salt;
      aux.hash = hash;
    }

    await prisma.user.update({
      where: {
        id: value.userId,
      },
      data: { ...aux },
    });

    return Response.json({ status: "success" });
  } catch (error) {
    return Response.json({ message: error.message }, { status: 500 });
  }
};
