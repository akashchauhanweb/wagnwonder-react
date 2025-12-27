import heic2any from "heic2any";

export async function imageCompressor(file, maxSizeKB = 150) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Provided file is not a valid image.");
  }

  // ✅ Convert HEIC to JPEG (common on iPhones)
  if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
    const jpegBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9,
    });

    file = new File([jpegBlob], file.name.replace(/\.heic$/i, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  // 📥 Read file as Data URL
  const dataURL = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });

  // 🖼 Load image
  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = dataURL;
  });

  // 🖌 Draw on canvas
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0);

  // 🔍 Check if browser supports WebP encoding
  const supportsWebP = await checkWebPSupport(canvas);

  // 🔁 Try compressing
  const outputType = supportsWebP ? "image/webp" : "image/jpeg";
  const outputExt = supportsWebP ? ".webp" : ".jpg";

  for (let q = 0.9; q >= 0.1; q -= 0.1) {
    await new Promise(requestAnimationFrame);
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, outputType, q);
    });

    if (blob) {
      return new File([blob], file.name.replace(/\.\w+$/, outputExt), {
        type: outputType,
        lastModified: Date.now(),
      });
    }
  }

  throw new Error("Could not compress image below " + maxSizeKB + "KB.");
}

// 🧪 Check if browser supports WebP encoding
async function checkWebPSupport(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob !== null && blob.type === "image/webp");
      },
      "image/webp",
      0.5
    );
  });
}