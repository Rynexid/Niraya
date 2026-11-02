"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let res: any = await authClient.signIn.email({ email, password });
      if (res?.error) {
        if (email === "demo@niraya.pos" && password === "demo1234") {
          try {
            await authClient.signUp.email({ email, password, name: "Demo User" });
          } catch {}
          res = await authClient.signIn.email({ email, password });
        } else {
          setError(res.error.message || "Login gagal");
          setLoading(false);
          return;
        }
      }
      if (res?.error) {
        setError(res.error.message || "Login gagal");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login gagal");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Masuk ke akun Anda</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Masukkan email Anda untuk masuk ke NIRAYA POS
          </p>
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Password</FieldLabel>
          </div>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>{loading ? "Memproses..." : "Masuk"}</Button>
        </Field>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            document.cookie = "niraya_demo=1; path=/; max-age=86400";
            router.push("/dashboard");
          }}
          disabled={loading}
        >
          Login Demo
        </Button>
        <Field>
          <FieldDescription className="text-center">
            Belum punya akun?{" "}
            <Link href="/signup" className="underline underline-offset-4">
              Daftar
            </Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
