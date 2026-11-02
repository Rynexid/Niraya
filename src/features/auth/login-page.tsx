import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2Icon,
  EyeIcon,
  EyeOffIcon,
  LockKeyholeIcon,
  ShieldAlertIcon,
  SparklesIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { ThemeToggle } from '@/components/shared/theme-toggle'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { DEMO_ACCOUNT } from '@/lib/demo-account'
import { useDemoAuthStore } from '@/stores/demo-auth-store'

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email wajib diisi')
    .refine(
      (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Format email tidak valid',
    ),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

type LoginValues = z.infer<typeof loginSchema>

const FEATURES = [
  'Katalog, stok, dan transaksi memakai satu sumber data.',
  'Laporan dan dashboard dihitung dari penjualan yang tersimpan.',
  'Semua data demo tetap berada di browser ini.',
] as const

/**
 * Demo sign-in screen inspired by the shadcn `login-02` split layout. It is
 * intentionally explicit about being a local preview, not real auth.
 */
export function LoginPage() {
  const session = useDemoAuthStore((state) => state.session)
  const signIn = useDemoAuthStore((state) => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)

  const from = (location.state as { from?: unknown } | null)?.from
  const redirectTo =
    typeof from === 'string' && from.startsWith('/') && from !== '/login'
      ? from
      : '/dashboard'

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  if (session) {
    return <Navigate to={redirectTo} replace />
  }

  const fillDemoAccount = () => {
    form.setValue('email', DEMO_ACCOUNT.email, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue('password', DEMO_ACCOUNT.password, {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setFocus('password')
  }

  const onSubmit = (values: LoginValues) => {
    const result = signIn(values.email, values.password)

    if (!result.ok) {
      form.setError('password', { message: result.reason })
      toast.error('Gagal masuk', { description: result.reason })
      return
    }

    toast.success('Berhasil masuk', {
      description: `Selamat datang, ${DEMO_ACCOUNT.name}.`,
    })
    navigate(redirectTo, { replace: true })
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-sidebar-border bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Logo size="md" />
        </div>

        <div className="max-w-md space-y-6">
          <Badge
            variant="outline"
            className="border-sidebar-border bg-sidebar-accent/40 text-[10px] tracking-wide text-sidebar-foreground/80 uppercase"
          >
            <SparklesIcon aria-hidden="true" className="size-3" />
            Preview build
          </Badge>
          <div className="space-y-3">
            <h1 className="text-3xl leading-tight font-semibold tracking-tight">
              Satu tempat untuk katalog, penjualan, dan stok.
            </h1>
            <p className="text-sm leading-relaxed text-sidebar-foreground/70">
              Niraya menyatukan terminal kasir, inventori, pelanggan, dan
              laporan tanpa berpindah aplikasi.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-sidebar-foreground/80"
              >
                <CheckCircle2Icon
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-sidebar-primary"
                />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-sidebar-foreground/50">
          Niraya POS oleh Rynex. Lingkungan demo lokal — bukan koneksi ke
          database atau layanan pembayaran nyata.
        </p>
      </aside>

      <main className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size="sm" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Masuk ke Niraya
              </h1>
              <Badge variant="secondary" className="text-[10px]">
                Demo
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Gunakan akun demo di bawah untuk membuka seluruh modul.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-3">
            <div className="flex items-start gap-2">
              <ShieldAlertIcon
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-warning"
              />
              <div className="min-w-0 flex-1 text-xs">
                <p className="font-semibold text-foreground">Akun demo</p>
                <p className="mt-1 font-mono text-[11px] break-all text-muted-foreground">
                  {DEMO_ACCOUNT.email}
                </p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {DEMO_ACCOUNT.password}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 h-8 w-full text-xs"
              onClick={fillDemoAccount}
            >
              Isi otomatis
            </Button>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-6 flex flex-col gap-4"
              noValidate
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        inputMode="email"
                        autoComplete="username"
                        placeholder="nama@niraya.id"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata sandi</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          className="pr-10"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="absolute top-1/2 right-1 -translate-y-1/2"
                        aria-label={
                          showPassword
                            ? 'Sembunyikan kata sandi'
                            : 'Tampilkan kata sandi'
                        }
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <EyeOffIcon aria-hidden="true" />
                        ) : (
                          <EyeIcon aria-hidden="true" />
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="mt-1 w-full">
                <LockKeyholeIcon aria-hidden="true" />
                Masuk
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            Ini sesi demo yang tersimpan di browser. Tidak ada autentikasi
            server dan tidak ada data nyata yang dikirim.
          </p>
        </div>
      </main>
    </div>
  )
}
