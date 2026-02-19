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
			// Invalidate availability queries to refetch and show updated status
			queryClient.invalidateQueries({ queryKey: ['timeSlotAvailability'] });
		},
		onError: async (error: unknown) => {
			const errorMessage = await getErrorMessage(error);
			enqueueSnackbar(errorMessage, { variant: 'error' });
		}
	});
};
