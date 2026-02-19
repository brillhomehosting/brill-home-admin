'use client';

import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Paper, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useCallback, useEffect, useState } from 'react';
import { useCreateBooking } from '../../../api/hooks/useCreateBooking';
import { useDeleteBooking } from '../../../api/hooks/useDeleteBooking';
import { useTimeSlotAvailability } from '../../../api/hooks/useTimeSlotAvailability';
import { TimeSlotAvailabilityItem } from '../../../api/types';

type TimeSlot = {
	id?: string;
	startTime?: string;
	endTime?: string;
	price?: number;
	isOvernight?: boolean;
};

type RoomTimeSlotsProps = {
	timeSlots: TimeSlot[];
	roomId?: string;
};

function RoomTimeSlots(props: RoomTimeSlotsProps) {
	const { timeSlots, roomId } = props;
	const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
	const [debouncedDate, setDebouncedDate] = useState<Date | null>(selectedDate);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedDate(selectedDate);
		}, 500);

		return () => {
			clearTimeout(timer);
		};
	}, [selectedDate]);

	// Fetch availability items for selected date
	const { data: availabilityItems = [], isLoading: isLoadingAvailability } = useTimeSlotAvailability(
		roomId || '',
		debouncedDate
	);

	// Booking mutations
	const { mutate: createBooking, isPending: isBooking } = useCreateBooking();
	const { mutate: deleteBooking, isPending: isDeleting } = useDeleteBooking();

	// Dialog state
	const [bookingDialog, setBookingDialog] = useState<{ open: boolean; slot: TimeSlot | null }>({ open: false, slot: null });
	const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; slot: TimeSlot | null; bookingId: string | null }>({ open: false, slot: null, bookingId: null });

	// Find matching availability item for a time slot
	const getSlotAvailability = useCallback((timeslot: TimeSlot): TimeSlotAvailabilityItem | undefined => {
		if (!selectedDate || availabilityItems.length === 0) {
			return undefined;
		}

		return availabilityItems.find((item) => {
			if (timeslot.id && item.timeSlot.id) {
				return item.timeSlot.id === timeslot.id;
			}
			return item.timeSlot.startTime === timeslot.startTime &&
				item.timeSlot.endTime === timeslot.endTime;
		});
	}, [selectedDate, availabilityItems]);

	// Check if a time slot has already passed
	const isTimeSlotPassed = useCallback((slot: TimeSlot): boolean => {
		if (!selectedDate || !slot.endTime) return false;

		const now = new Date();
		const [hours, minutes] = slot.endTime.split(':').map(Number);

		const slotEnd = new Date(selectedDate);
		slotEnd.setHours(hours, minutes, 0, 0);

		// For overnight slots, endTime is on the next day
		if (slot.isOvernight) {
			slotEnd.setDate(slotEnd.getDate() + 1);
		}

		return slotEnd < now;
	}, [selectedDate]);

	// Handle booking
	const handleBookSlot = (slot: TimeSlot) => {
		setBookingDialog({ open: true, slot });
	};

	const handleConfirmBooking = () => {
		if (!bookingDialog.slot || !bookingDialog.slot.id || !roomId || !selectedDate) return;

		const year = selectedDate.getFullYear();
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
		const day = String(selectedDate.getDate()).padStart(2, '0');
		const dateString = `${year}-${month}-${day}`;

		createBooking(
			{
				roomId,
				timeSlotId: bookingDialog.slot.id!,
				date: dateString
			},
			{
				onSuccess: () => {
					setBookingDialog({ open: false, slot: null });
				},
				onError: () => {
					setBookingDialog({ open: false, slot: null });
				}
			}
		);
	};

	// Handle delete booking
	const handleDeleteBooking = (slot: TimeSlot, bookingId: string) => {
		setDeleteDialog({ open: true, slot, bookingId });
	};

	const handleConfirmDelete = () => {
		if (!deleteDialog.bookingId) return;

		deleteBooking(deleteDialog.bookingId, {
			onSuccess: () => {
				setDeleteDialog({ open: false, slot: null, bookingId: null });
			},
			onError: () => {
				setDeleteDialog({ open: false, slot: null, bookingId: null });
			}
		});
	};

	if (!timeSlots || timeSlots.length === 0) {
		return null;
	}

	return (
		<Paper
			className="mb-4 p-6"
			elevation={1}
		>
			<Typography
				variant="h5"
				className="mb-4 font-bold"
			>
				Khung giờ
			</Typography>

			{/* Date Picker for checking availability */}
			{roomId && (
				<Box className="mb-4">
					<Paper sx={{ p: 2, bgcolor: 'background.default' }} elevation={0}>
						<Box className="flex items-center gap-3">
							<FuseSvgIcon size={20} color="action">lucide:calendar</FuseSvgIcon>
							<Box className="flex-1">
								<DatePicker
									label="Kiểm tra tình trạng theo ngày"
									value={selectedDate}
									onChange={(newDate) => setSelectedDate(newDate)}
									format="dd/MM/yyyy"
									slotProps={{
										textField: {
											size: 'small',
											fullWidth: true
										}
									}}
								/>
							</Box>
							{isLoadingAvailability && (
								<Typography variant="caption" color="text.secondary">
									Đang kiểm tra...
								</Typography>
							)}
						</Box>
						<Typography variant="caption" color="text.secondary" className="mt-2 block">
							Chọn ngày để xem khung giờ nào còn trống hoặc đã được đặt
						</Typography>
					</Paper>
				</Box>
			)}

			<Grid
				container
				spacing={3}
			>
				{timeSlots.map((slot, idx) => {
					const availabilityItem = roomId ? getSlotAvailability(slot) : undefined;
					const isAvailable = roomId ? (availabilityItem ? availabilityItem.isActive : true) : true;
					const bookingId = availabilityItem?.bookingId;
					const isPassed = isTimeSlotPassed(slot);
					const canDelete = !isAvailable && !!bookingId && !isPassed;

					return (
						<Grid
							key={slot.id || idx}
							size={{ sm: 12, md: 6 }}
						>
							<Paper
								className="p-4 h-full"
								elevation={0}
								sx={{
									bgcolor: isAvailable ? 'background.paper' : 'grey.50',
									opacity: isAvailable ? 1 : 0.7,
									borderWidth: 2,
									borderStyle: 'solid',
									borderColor: isAvailable ? 'success.light' : 'error.main',
									transition: 'all 0.2s ease-in-out',
									position: 'relative',
									overflow: 'hidden',
									'&::before': !isAvailable ? {
										content: '""',
										position: 'absolute',
										top: 0,
										left: 0,
										right: 0,
										height: '4px',
										bgcolor: 'error.main',
									} : {}
								}}
							>
								{/* Header with Title */}
								<Box className="mb-3">
									<Typography
										variant="h6"
										className="font-semibold mb-2"
									>
										Khung giờ {idx + 1}
									</Typography>

									{/* Status Chips Row */}
									<Box className="flex gap-1 items-center">
										{slot.isOvernight && (
											<Chip
												label="Qua đêm"
												size="small"
												color="primary"
												icon={<FuseSvgIcon size={14}>lucide:moon</FuseSvgIcon>}
												sx={{ fontWeight: 500 }}
											/>
										)}
										{roomId && !isAvailable && (
											<Chip
												size="small"
												label="Đã đặt"
												color="error"
												icon={<FuseSvgIcon size={14}>lucide:calendar-x</FuseSvgIcon>}
												variant="filled"
												sx={{ fontWeight: 500 }}
											/>
										)}
										{roomId && isAvailable && (
											<Chip
												size="small"
												label="Có sẵn"
												color="success"
												icon={<FuseSvgIcon size={14}>lucide:calendar-check</FuseSvgIcon>}
												variant="outlined"
												sx={{ fontWeight: 500 }}
											/>
										)}
									</Box>
								</Box>
								{/* Time Slot Information */}
								<Box className="space-y-2">
									<Box className="flex items-center gap-2">
										<FuseSvgIcon
											size={18}
											className="text-gray-500"
										>
											lucide:clock
										</FuseSvgIcon>
										<Typography variant="body2" className="font-medium">
											{slot.startTime} - {slot.endTime}
										</Typography>
									</Box>
									<Box className="flex items-center gap-2">
										<FuseSvgIcon
											size={18}
											className="text-gray-500"
										>
											lucide:dollar-sign
										</FuseSvgIcon>
										<Typography
											variant="body1"
											className="font-semibold"
											color="primary"
										>
											{slot.price?.toLocaleString() || 0} VND
										</Typography>
									</Box>

									{/* Book Button for available slots */}
									{roomId && isAvailable && selectedDate && (
										<Box className="pt-2">
											<Button
												variant="contained"
												color="primary"
												size="medium"
												fullWidth
												onClick={() => handleBookSlot(slot)}
												startIcon={<FuseSvgIcon size={16}>lucide:calendar-plus</FuseSvgIcon>}
												sx={{
													py: 1,
													fontWeight: 600,
													textTransform: 'none'
												}}
											>
												Đặt khung giờ
											</Button>
										</Box>
									)}

									{/* Delete Button for booked slots that haven't passed */}
									{roomId && canDelete && (
										<Box className="pt-2">
											<Button
												variant="outlined"
												color="error"
												size="medium"
												fullWidth
												onClick={() => handleDeleteBooking(slot, bookingId!)}
												startIcon={<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>}
												sx={{
													py: 1,
													fontWeight: 600,
													textTransform: 'none'
												}}
											>
												Xóa đặt phòng
											</Button>
										</Box>
									)}

									{/* Message for booked slots that have passed */}
									{roomId && !isAvailable && isPassed && (
										<Box className="pt-2">
											<Paper
												sx={{
													p: 1.5,
													bgcolor: 'grey.100',
													border: '1px solid',
													borderColor: 'grey.300'
												}}
												elevation={0}
											>
												<Typography
													variant="caption"
													color="text.disabled"
													className="flex items-center gap-1"
												>
													<FuseSvgIcon size={14}>lucide:clock</FuseSvgIcon>
													Khung giờ đã qua
												</Typography>
											</Paper>
										</Box>
									)}

									{/* Message for booked slots without bookingId (no delete possible) */}
									{roomId && !isAvailable && !bookingId && !isPassed && (
										<Box className="pt-2">
											<Paper
												sx={{
													p: 1.5,
													bgcolor: 'error.50',
													border: '1px solid',
													borderColor: 'error.200'
												}}
												elevation={0}
											>
												<Typography
													variant="caption"
													color="error.dark"
													className="flex items-center gap-1"
												>
													<FuseSvgIcon size={14}>lucide:info</FuseSvgIcon>
													Khung giờ này đã được đặt
												</Typography>
											</Paper>
										</Box>
									)}
								</Box>
							</Paper>
						</Grid>
					);
				})}
			</Grid>

			{/* Booking Confirmation Dialog */}
			<Dialog
				open={bookingDialog.open}
				onClose={() => !isBooking && setBookingDialog({ open: false, slot: null })}
			>
				<DialogTitle>Xác nhận đặt phòng</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Bạn có chắc muốn đặt khung giờ này không?
						<br />
						<strong>Thời gian:</strong> {bookingDialog.slot?.startTime} - {bookingDialog.slot?.endTime}
						<br />
						<strong>Ngày:</strong> {selectedDate?.toLocaleDateString('vi-VN')}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setBookingDialog({ open: false, slot: null })}
						disabled={isBooking}
					>
						Hủy
					</Button>
					<Button
						onClick={handleConfirmBooking}
						color="primary"
						variant="contained"
						disabled={isBooking}
						startIcon={
							isBooking ? (
								<FuseSvgIcon size={16}>lucide:loader-2</FuseSvgIcon>
							) : (
								<FuseSvgIcon size={16}>lucide:check</FuseSvgIcon>
							)
						}
					>
						{isBooking ? 'Đang đặt...' : 'Xác nhận'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Booking Confirmation Dialog */}
			<Dialog
				open={deleteDialog.open}
				onClose={() => !isDeleting && setDeleteDialog({ open: false, slot: null, bookingId: null })}
			>
				<DialogTitle sx={{ color: 'error.main' }}>Xác nhận xóa đặt phòng</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Bạn có chắc muốn xóa đặt phòng này không? Hành động này <strong>không thể hoàn tác</strong>.
						<br />
						<strong>Thời gian:</strong> {deleteDialog.slot?.startTime} - {deleteDialog.slot?.endTime}
						<br />
						<strong>Ngày:</strong> {selectedDate?.toLocaleDateString('vi-VN')}
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setDeleteDialog({ open: false, slot: null, bookingId: null })}
						disabled={isDeleting}
					>
						Hủy
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
						disabled={isDeleting}
						startIcon={
							isDeleting ? (
								<FuseSvgIcon size={16}>lucide:loader-2</FuseSvgIcon>
							) : (
								<FuseSvgIcon size={16}>lucide:trash-2</FuseSvgIcon>
							)
						}
					>
						{isDeleting ? 'Đang xóa...' : 'Xóa đặt phòng'}
					</Button>
				</DialogActions>
			</Dialog>
		</Paper>
	);
}

export default RoomTimeSlots;
