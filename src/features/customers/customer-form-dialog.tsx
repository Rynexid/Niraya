"use client";

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { Customer } from '@/types/business'

const customerSchema = z.object({
  name: z.string().trim().min(1, 'Nama pelanggan wajib diisi'),
  phone: z
    .string()
    .trim()
    .min(8, 'Nomor telepon minimal 8 digit')
    .refine(
      (value) => value.replace(/\D/g, '').length >= 8,
      'Nomor telepon tidak valid',
    ),
  email: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) =>
        !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      'Format email tidak valid',
    ),
  notes: z.string().trim().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer?: Customer | null
  onSubmit: (values: CustomerFormValues) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Edit pelanggan' : 'Tambah pelanggan'}
          </DialogTitle>
          <DialogDescription>
            Data pelanggan dipakai untuk memilih pembeli saat transaksi di POS.
          </DialogDescription>
        </DialogHeader>

        <CustomerFormBody
          key={customer?.id ?? 'new'}
          customer={customer}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (onSubmit(values)) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function CustomerFormBody({
  customer,
  onCancel,
  onSubmit,
}: {
  customer?: Customer | null
  onCancel: () => void
  onSubmit: (values: CustomerFormValues) => void
}) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      notes: customer?.notes ?? '',
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama lengkap</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Aulia Rahma" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nomor telepon</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    inputMode="tel"
                    placeholder="0812-3456-7890"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="nama@email.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan</FormLabel>
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="Preferensi, alergi, atau catatan lain"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {customer ? 'Simpan perubahan' : 'Tambah pelanggan'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
