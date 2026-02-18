import { bookingsApi } from '@/services/bookingsApiService';
import { getErrorMessage } from '@/utils/errorUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

export const useDeleteBooking = () => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	return useMutation({
		mutationFn: (bookingId: string) => bookingsApi.deleteBooking(bookingId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timeSlotAvailability'] });
			enqueueSnackbar('Xóa đặt phòng thành công', { variant: 'success' });
		},
		onError: async (error: unknown) => {
			const errorMessage = await getErrorMessage(error);
			enqueueSnackbar(errorMessage, { variant: 'error' });
		}
	});
};
