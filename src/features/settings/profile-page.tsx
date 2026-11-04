"use client"

import Link from 'next/link'
import { User, Mail, Building, ShieldCheck, Clock } from "lucide-react"

import { useRealUser } from "@/hooks/use-real-user"
import { initials } from "@/features/customers/customer-detail-sheet"

export function ProfilePage() {
  const realUser = useRealUser(true)

  const currentUser = {
    name: realUser?.name ?? "Akun terdaftar",
    email: realUser?.email ?? "",
    role: realUser?.role ?? "Pengguna",
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <Link href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <span className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-[24px] font-semibold">
                  {initials(currentUser.name)}
                </span>
                <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background" />
              </div>
              <div>
                <h2 className="font-semibold">{currentUser.name}</h2>
                <p className="text-sm text-muted-foreground">{currentUser.role} • Niraya POS</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate">{currentUser.name}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm truncate text-muted-foreground">{currentUser.email}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Niraya POS</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{currentUser.role}</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Sesi terdaftar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Pengaturan Akun
            </h3>
            <div className="space-y-1">
              <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-accent transition-colors">
                <span className="font-medium">Ubah Kata Sandi</span>
              </button>
              <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-accent transition-colors">
                <span className="font-medium">Notifikasi</span>
              </button>
              <button className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-left text-sm hover:bg-accent transition-colors">
                <span className="font-medium">Preferensi Bahasa</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
