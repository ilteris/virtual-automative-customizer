/**
 * Converts a File object to a base64 data URL.
 * @param file The file to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Fetches an image from a URL and converts it to a File object.
 * @param url The URL of the image to fetch.
 * @param filename The desired filename for the new File object.
 * @param mimeType Optional MIME type. If not provided, it will be inferred.
 * @returns A promise that resolves with the created File object.
 */
export const urlToFile = async (url: string, filename: string, mimeType?: string): Promise<File> => {
    const res = await fetch(url);
    const blob = await res.blob();
    const type = mimeType || blob.type || 'image/jpeg';
    return new File([blob], filename, { type });
};
