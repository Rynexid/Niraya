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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await authClient.signUp.email({ email, password, name });
      if (res.error) {
        setError(res.error.message || "Signup gagal");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup gagal");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Buat akun baru</h1>
          <p className="text-sm text-balance text-muted-foreground">
            Daftar untuk menggunakan NIRAYA POS
          </p>
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Field>
          <FieldLabel htmlFor="name">Nama Lengkap</FieldLabel>
          <Input id="name" type="text" placeholder="John Doe" value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <FieldDescription>Minimal 8 karakter</FieldDescription>
        </Field>
        <Field>
          <Button type="submit" disabled={loading}>{loading ? "Memproses..." : "Daftar"}</Button>
        </Field>
<Field>
          <FieldDescription className="px-6 text-center">
            Sudah punya akun? <Link href="/login" className="underline underline-offset-4">Masuk</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  );
}
