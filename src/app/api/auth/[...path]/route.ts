import { auth } from "@/server/auth";

export const { GET, POST, PUT, DELETE, PATCH } = auth.handler();
