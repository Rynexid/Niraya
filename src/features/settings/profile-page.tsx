"use client"

import { Link } from "react-router-dom"
import { User, Mail, Building, ShieldCheck, Clock } from "lucide-react"

export function ProfilePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
          ← Kembali ke Dashboard
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop"
                  alt="Sarah Vance"
                  className="h-20 w-20 rounded-full object-cover border border-border"
                />
                <div className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-background" />
              </div>
              <div>
                <h2 className="font-semibold">Sarah Vance</h2>
                <p className="text-sm text-muted-foreground">Cashier • Reg #01</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Sarah Vance</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">sarah@niraya.pos</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">NIRAYA Enterprise POS</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Admin</span>
              </div>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border/50">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Bergabung sejak 01 Jan 2026</span>
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
