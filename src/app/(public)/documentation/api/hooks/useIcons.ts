import { useQuery } from '@tanstack/react-query';
import { api } from '@/utils/api';

/**
 * Hook to fetch available icon names from the API.
 */
export function useIcons(apiUrl: string) {
	return useQuery<string[]>({
		queryKey: ['icons', apiUrl],
		queryFn: async () => {
			const response = await api.get(apiUrl);
			return response.json<string[]>();
		},
		staleTime: Infinity
	});
}
