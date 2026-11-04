import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import { fetchBusinessData, mutateBusiness } from "@/lib/api"
import { queryClient } from "@/lib/query-client"

export const BUSINESS_QUERY_KEY = ["business"]

export function useBusinessQuery({ enabled }: { enabled: boolean }) {
  return useQuery({
    queryKey: BUSINESS_QUERY_KEY,
    queryFn: fetchBusinessData,
    enabled,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export function useBusinessMutation() {
  const client = useQueryClient()

  return useMutation({
    mutationFn: ({ action, payload }: { action: string; payload: unknown }) =>
      mutateBusiness(action, payload),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: BUSINESS_QUERY_KEY })
    },
    onError: () => {
      client.invalidateQueries({ queryKey: BUSINESS_QUERY_KEY })
    },
  })
}

export { queryClient }
