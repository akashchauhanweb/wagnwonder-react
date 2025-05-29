import heic2any from "heic2any";


export async function imageCompressor(file, maxSizeKB = 150) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Provided file is not a valid image.");
  }
  // ✅ Convert HEIC to JPEG
  if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
    const jpegBlob = await heic2any({
      blob: file,
      toType: "image/jpeg",
      quality: 0.9
    });

    file = new File([jpegBlob], file.name.replace(/\.heic$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now()
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

  // 🔁 Try compressing to WebP under maxSizeKB
  for (let q = 0.9; q >= 0.1; q -= 0.05) {
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/webp", q)
    );

    if (blob && blob.size / 1024 <= maxSizeKB) {
      return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
        type: "image/webp",
        lastModified: Date.now(),
      });
    }
  }

  throw new Error("Could not compress image below " + maxSizeKB + "KB.");
}
