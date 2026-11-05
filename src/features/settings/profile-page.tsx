"use client"

import Link from 'next/link'
import { User, Mail, ShieldCheck, Calendar, LogOut, LayoutDashboard } from "lucide-react"
import { useRouter } from "next/navigation"

import { useRealUser } from "@/hooks/use-real-user"
import { appRoleLabel } from "@/lib/business-labels"
import { initials } from "@/features/customers/customer-detail-sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"

export function ProfilePage() {
  const router = useRouter()
  const realUser = useRealUser(true)

  const role = realUser?.role
  const isRegularUser = role === "user"
  const displayRole = appRoleLabel(role)
  const canAccessDashboard = !isRegularUser && !!role

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
    } finally {
      router.replace("/login")
      router.refresh()
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Profil Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi akun dan preferensi pribadi Anda</p>
        </div>
        {canAccessDashboard && (
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="h-fit">
          <CardHeader className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
              {initials(realUser?.name ?? "Akun")}
            </div>
            <CardTitle className="mt-4 text-xl">{realUser?.name ?? "Akun terdaftar"}</CardTitle>
            <CardDescription className="flex items-center justify-center gap-2">
              <span className="truncate">{realUser?.email ?? "-"}</span>
            </CardDescription>
            <div className="mt-2 flex justify-center">
              <Badge variant={isRegularUser ? "secondary" : "default"}>{displayRole}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" disabled>
              <User className="mr-2 h-4 w-4" />
              Edit Profil (Segera hadir)
            </Button>
            <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Akun</CardTitle>
              <CardDescription>Detail identitas akun Anda yang terhubung ke Neon Auth</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="rounded-full bg-muted p-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Nama Lengkap</p>
                    <p className="text-sm text-muted-foreground">{realUser?.name ?? "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="rounded-full bg-muted p-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    <p className="truncate text-sm text-muted-foreground">{realUser?.email ?? "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="rounded-full bg-muted p-2">
                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Role Akun</p>
                    <p className="text-sm text-muted-foreground">{displayRole}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="rounded-full bg-muted p-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Status</p>
                    <p className="text-sm text-muted-foreground">Aktif</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keamanan</CardTitle>
              <CardDescription>Pengaturan terkait akses dan keamanan akun Anda</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Kata Sandi</p>
                  <p className="text-sm text-muted-foreground">Kelola kata sandi melalui alur autentikasi Neon Auth</p>
                </div>
                <Button variant="outline" size="sm" disabled>
                  Atur Ulang Kata Sandi
                </Button>
              </div>
              <Separator />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Sesi</p>
                  <p className="text-sm text-muted-foreground">Keluar dari akun Anda di perangkat ini</p>
                </div>
                <Button variant="destructive" size="sm" onClick={handleSignOut}>
                  Keluar dari Sesi
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
