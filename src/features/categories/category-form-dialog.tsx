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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Category } from '@/types/business'

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nama kategori wajib diisi'),
  description: z.string().trim().optional(),
  status: z.enum(['active', 'archived']),
})

export type CategoryFormValues = z.infer<typeof categorySchema>

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category | null
  onSubmit: (values: CategoryFormValues) => boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {category ? 'Edit kategori' : 'Tambah kategori'}
          </DialogTitle>
          <DialogDescription>
            Kelompokkan produk agar katalog POS lebih mudah ditelusuri.
          </DialogDescription>
        </DialogHeader>

        <CategoryFormBody
          key={category?.id ?? 'new'}
          category={category}
          onCancel={() => onOpenChange(false)}
          onSubmit={(values) => {
            if (onSubmit(values)) onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

function CategoryFormBody({
  category,
  onCancel,
  onSubmit,
}: {
  category?: Category | null
  onCancel: () => void
  onSubmit: (values: CategoryFormValues) => void
}) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? '',
      description: category?.description ?? '',
      status: category?.status ?? 'active',
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
              <FormLabel>Nama kategori</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Bakery & Pastry" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Penjelasan singkat isi kategori"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="archived">Diarsipkan</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
          <Button type="submit">
            {category ? 'Simpan perubahan' : 'Tambah kategori'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
