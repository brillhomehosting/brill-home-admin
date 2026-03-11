import { ApiResponse } from '@/types';
import { mainApi } from '@/utils/api';

export type UploadFolder = 'ROOMS' | 'BLOGS';

type RawUploadResponse = {
	url?: string;
	secure_url?: string;
	public_id?: string;
	publicId?: string;
	filename?: string;
};

export type UploadResponse = {
	url: string;
	secureUrl?: string;
	publicId?: string;
	filename?: string;
};

const normalizeUploadResponse = (data: RawUploadResponse): UploadResponse => {
	const url = data.url || data.secure_url;

	if (!url) {
		throw new Error('Upload response missing image URL');
	}

	return {
		url,
		secureUrl: data.secure_url,
		publicId: data.public_id || data.publicId,
		filename: data.filename
	};
};

export const uploadsApi = {
	/**
	 * Upload a single file to the specified folder
	 * @param file - The file to upload
	 * @param folder - The target folder ('ROOMS' | 'BLOGS')
	 * @returns Upload response with the file URL
	 */
	uploadFile: async (file: File, folder: UploadFolder): Promise<UploadResponse> => {
		const formData = new FormData();
		formData.append('file', file);

		const result = await mainApi
			.post('uploads', {
				body: formData,
				searchParams: { folder },
				timeout: 60000
			})
			.json<ApiResponse<RawUploadResponse>>();

		return normalizeUploadResponse(result.data);
	},

	/**
	 * Upload multiple files to the specified folder
	 * @param files - Array of files to upload
	 * @param folder - The target folder ('ROOMS' | 'BLOGS')
	 * @returns Array of upload responses
	 */
	uploadFiles: async (files: File[], folder: UploadFolder): Promise<UploadResponse[]> => {
		const uploadPromises = files.map((file) => uploadsApi.uploadFile(file, folder));
		return Promise.all(uploadPromises);
	},

	/**
	 * Delete an image by its URL
	 * @param url - The URL of the image to delete
	 */
	deleteImageByUrl: async (url: string): Promise<void> => {
		await mainApi.delete('uploads/by-url', {
			searchParams: { url }
		});
	},

	/**
	 * Delete multiple images by their URLs
	 * @param urls - Array of image URLs to delete
	 */
	deleteImagesByUrls: async (urls: string[]): Promise<void> => {
		const deletePromises = urls.map((url) => uploadsApi.deleteImageByUrl(url));
		await Promise.all(deletePromises);
	}
};
