import imageCompression from "browser-image-compression";

/**
 * Compresses an image file (~1600px max dimension, quality ~0.8) and re-encodes
 * through an offscreen canvas so all EXIF / GPS / camera metadata is stripped
 * client-side before uploading to the server.
 */
export const compressAndStripExif = async (file) => {
  if (!file) throw new Error("No file selected");

  const compressed = await imageCompression(file, {
    maxSizeMB: 2.5,
    maxWidthOrHeight: 1600,
    initialQuality: 0.82,
    useWebWorker: true,
    fileType: "image/jpeg",
    preserveExif: false,
  });

  // Canvas pass guarantees zero EXIF / GPS metadata remains across all browsers
  const bitmap = await createImageBitmap(compressed);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0);

    const cleanBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not encode cleaned image"));
        },
        "image/jpeg",
        0.82
      );
    });

    const baseName = (file.name || "progress-photo").replace(/\.[^.]+$/, "");
    return new File([cleanBlob], `${baseName}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
};

/**
 * Center-crops an image into a crisp <= 512x512 square avatar and strips EXIF/GPS metadata.
 */
export const compressAvatarImage = async (file) => {
  if (!file) throw new Error("No image selected");

  const compressed = await imageCompression(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 768,
    initialQuality: 0.85,
    useWebWorker: true,
    fileType: "image/jpeg",
    preserveExif: false,
  });

  const bitmap = await createImageBitmap(compressed);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const sx = Math.floor((bitmap.width - side) / 2);
    const sy = Math.floor((bitmap.height - side) / 2);
    const targetSide = Math.min(512, side);

    const canvas = document.createElement("canvas");
    canvas.width = targetSide;
    canvas.height = targetSide;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, targetSide, targetSide);

    const cleanBlob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Could not process avatar photo"));
        },
        "image/jpeg",
        0.85
      );
    });

    return new File([cleanBlob], `avatar-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close?.();
  }
};
