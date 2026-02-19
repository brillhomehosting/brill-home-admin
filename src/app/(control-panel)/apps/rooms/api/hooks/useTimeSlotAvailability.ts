import { useQuery } from '@tanstack/react-query';
import { timeslotsApi } from '../services/timeslotApiService';
import { TimeSlotAvailabilityItem } from '../types';

export const useTimeSlotAvailability = (roomId: string, selectedDate: Date | null) => {
	// Format date to YYYY-MM-DD using local date parts to avoid UTC offset shifting the date
	const formatDate = (date: Date): string => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	};

	const dateString = selectedDate ? formatDate(selectedDate) : null;

	return useQuery<TimeSlotAvailabilityItem[]>({
		queryKey: ['timeSlotAvailability', roomId, dateString],
		queryFn: () => {
			if (!dateString) {
				return Promise.resolve([]);
			}
			// Use same date for both startDay and endDay since we're checking one day
			return timeslotsApi.getTimeSlotAvailability(roomId, dateString, dateString);
		},
		enabled: !!roomId && !!dateString,
		staleTime: 30000 // Cache for 30 seconds
	});
};
