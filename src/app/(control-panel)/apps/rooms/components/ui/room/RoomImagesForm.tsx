'use client';

import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	Paper,
	Typography
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useSnackbar } from 'notistack';
import { useRef, useState } from 'react';
import { Control, FieldValues, useFieldArray } from 'react-hook-form';

export type RoomImageField = {
	imageId?: string;
	file?: File;
	url: string;
	isLocal: boolean; // true = local preview, false = already uploaded
	fieldId?: string;
};

type RoomImagesFormProps = {
	control: Control<FieldValues>;
	isImmediateDeleteEnabled?: boolean;
	onDeletePersistedImage?: (image: RoomImageField) => Promise<boolean>;
};

function RoomImagesForm(props: RoomImagesFormProps) {
	const { control, isImmediateDeleteEnabled = false, onDeletePersistedImage } = props;
	const { enqueueSnackbar } = useSnackbar();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const { fields, append, remove } = useFieldArray({
		control,
		name: 'images',
		keyName: 'fieldId'
	});

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;

		if (!files || files.length === 0) return;

		// Filter files > 10MB
		const validFiles: File[] = [];
		const MAX_SIZE_MB = 10;
		const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

		Array.from(files).forEach((file) => {
			if (file.size > MAX_SIZE_BYTES) {
				enqueueSnackbar(`Ảnh "${file.name}" vượt quá giới hạn ${MAX_SIZE_MB}MB`, { variant: 'warning' });
			} else {
				validFiles.push(file);
			}
		});

		// Add files as local preview (not uploaded yet)
		validFiles.forEach((file) => {
			const localUrl = URL.createObjectURL(file);
			append({
				file,
				url: localUrl,
				isLocal: true
			});
		});

		// Reset input
		if (fileInputRef.current) {
			fileInputRef.current.value = '';
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const files = e.dataTransfer.files;

		if (!files || files.length === 0) return;

		// Filter files > 10MB
		const validFiles: File[] = [];
		const MAX_SIZE_MB = 10;
		const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

		Array.from(files).forEach((file) => {
			if (!file.type.startsWith('image/')) {
				return;
			}

			if (file.size > MAX_SIZE_BYTES) {
				enqueueSnackbar(`Ảnh "${file.name}" vượt quá giới hạn ${MAX_SIZE_MB}MB`, { variant: 'warning' });
			} else {
				validFiles.push(file);
			}
		});

		validFiles.forEach((file) => {
			const localUrl = URL.createObjectURL(file);
			append({
				file,
				url: localUrl,
				isLocal: true
			});
		});
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const removeImageAtIndex = (index: number) => {
		const field = fields[index] as RoomImageField | undefined;

		if (field?.isLocal && field?.url) {
			URL.revokeObjectURL(field.url);
		}

		remove(index);
	};

	const handleDeleteClick = (index: number) => {
		setPendingDeleteIndex(index);
	};

	const handleCloseDeleteDialog = () => {
		if (isDeleting) {
			return;
		}

		setPendingDeleteIndex(null);
	};

	const handleConfirmDelete = async () => {
		if (pendingDeleteIndex === null) {
			return;
		}

		const field = fields[pendingDeleteIndex] as RoomImageField | undefined;

		if (!field) {
			setPendingDeleteIndex(null);
			return;
		}

		if (!field.isLocal && isImmediateDeleteEnabled && onDeletePersistedImage) {
			setIsDeleting(true);
			const isDeleted = await onDeletePersistedImage(field);
			setIsDeleting(false);

			if (!isDeleted) {
				setPendingDeleteIndex(null);
				return;
			}
		}

		removeImageAtIndex(pendingDeleteIndex);
		setPendingDeleteIndex(null);
	};

	return (
		<div>
			{/* Upload Area */}
			<Paper
				className="hover:border-primary mb-4 cursor-pointer border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
				elevation={0}
				onClick={() => fileInputRef.current?.click()}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
			>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					multiple
					hidden
					onChange={handleFileSelect}
				/>
				<Box className="flex flex-col items-center gap-2">
					<FuseSvgIcon
						size={48}
						className="text-gray-400"
					>
						lucide:cloud-upload
					</FuseSvgIcon>
					<Typography
						variant="body1"
						fontWeight="medium"
					>
						Nhấp hoặc kéo hình ảnh vào đây
					</Typography>
					<Typography
						variant="body2"
						color="text.secondary"
					>
						Hỗ trợ: JPG, PNG, GIF, WebP
					</Typography>
					<Typography
						variant="caption"
						color="warning.main"
					>
						Hình ảnh sẽ được tải lên khi bạn lưu
					</Typography>
				</Box>
			</Paper>

			{/* Image Grid */}
			{fields.length > 0 && (
				<Grid
					container
					spacing={2}
				>
					{fields.map((field, index: number) => (
						<Grid
							key={field.fieldId}
							size={{ xs: 6, sm: 4, md: 3 }}
						>
							<Paper
								className="group relative aspect-square overflow-hidden"
								elevation={2}
							>
								<img
									src={field.url}
									alt={`Room image ${index + 1}`}
									className="h-full w-full object-cover"
								/>
								{/* Local file indicator */}
								{field.isLocal && (
									<div className="absolute top-2 right-2 rounded bg-yellow-500 px-2 py-0.5 text-xs text-white">
										Chờ xử lý
									</div>
								)}
								{/* Overlay on hover */}
								<div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
									<IconButton
										size="small"
										className="bg-red-500 text-white hover:bg-red-600"
										onClick={() => handleDeleteClick(index)}
									>
										<FuseSvgIcon size={20}>lucide:trash-2</FuseSvgIcon>
									</IconButton>
								</div>
								{/* Image index badge */}
								<div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-xs text-white">
									{index + 1}
								</div>
							</Paper>
						</Grid>
					))}
				</Grid>
			)}

			{/* Empty state */}
			{fields.length === 0 && (
				<Typography
					variant="body2"
					color="text.secondary"
					className="text-center"
				>
					Chưa có hình ảnh nào
				</Typography>
			)}

			<Dialog
				open={pendingDeleteIndex !== null}
				onClose={handleCloseDeleteDialog}
				fullWidth
				maxWidth="xs"
			>
				<DialogTitle>Xóa hình ảnh</DialogTitle>
				<DialogContent>
					<Typography color="text.secondary">Bạn có chắc muốn xóa hình ảnh này không?</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={handleCloseDeleteDialog}
						color="inherit"
						disabled={isDeleting}
					>
						Hủy
					</Button>
					<Button
						onClick={handleConfirmDelete}
						color="error"
						variant="contained"
						disabled={isDeleting}
					>
						{isDeleting ? 'Đang xóa...' : 'Xóa'}
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

export default RoomImagesForm;
