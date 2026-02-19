import { bookingsApi, CreateBookingData } from '@/services/bookingsApiService';
import { getErrorMessage } from '@/utils/errorUtils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';

export const useCreateBooking = () => {
	const queryClient = useQueryClient();
	const { enqueueSnackbar } = useSnackbar();

	return useMutation({
		mutationFn: (data: CreateBookingData) => bookingsApi.createBooking(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timeSlotAvailability'] });
			enqueueSnackbar('Đặt khung giờ thành công', { variant: 'success' });
		},
		onError: async (error: unknown) => {
			queryClient.invalidateQueries({ queryKey: ['timeSlotAvailability'] });
			const errorMessage = await getErrorMessage(error);
			enqueueSnackbar(errorMessage, { variant: 'error' });
		}
	});
};
