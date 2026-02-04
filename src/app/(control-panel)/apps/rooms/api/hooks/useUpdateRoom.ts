import { getErrorMessage } from '@/utils/errorUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { roomsApi } from '../services/roomsApiService';
import { Room } from '../types';
import { roomKeys } from './queryKeys';

export const useUpdateRoom = () => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	return useMutation({
		mutationFn: ({ roomId, data, showSuccessToast = true }: { roomId: string; data: Partial<Room>; showSuccessToast?: boolean }) =>
			roomsApi.updateRoom(roomId, data),
		onSuccess: (_, { roomId, showSuccessToast = true }) => {
			// Invalidate room lists and specific room detail
			queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
			queryClient.invalidateQueries({ queryKey: roomKeys.detail(roomId) });

			if (showSuccessToast) {
				enqueueSnackbar('Cập nhật phòng thành công', { variant: 'success' });
			}
		},
		onError: async (error: unknown) => {
			const errorMessage = await getErrorMessage(error);
			enqueueSnackbar(errorMessage, { variant: 'error' });
		}
	});
};
