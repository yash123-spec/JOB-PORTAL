// src/utils/img.js
// Optimize Cloudinary-hosted images at delivery time — without re-uploading.
// Injects transforms right after "/upload/":
//   f_auto   → best format for the browser (WebP/AVIF)
//   q_auto   → automatic quality (smaller files, no visible loss)
//   dpr_auto → serve retina-sharp on high-DPI screens
//   w_/c_fill/g_face → downscale to the real display size, face-centered crop
//
// Non-Cloudinary URLs (local /149071.png, external logos) are returned untouched.
export const optimizedImage = (url, { width, height } = {}) => {
    if (!url || typeof url !== "string") return url;

    const marker = "/upload/";
    const idx = url.indexOf(marker);
    if (!url.includes("res.cloudinary.com") || idx === -1) return url;

    // Don't double-insert if a transform block already sits right after /upload/
    const after = url.slice(idx + marker.length);
    const firstSeg = after.split("/")[0];
    if (/(^|,)(f_auto|q_auto|w_\d+|c_fill)/.test(firstSeg)) return url;

    const transforms = ["f_auto", "q_auto", "dpr_auto"];
    if (width) transforms.push(`w_${width}`, "c_fill", "g_face");
    if (height) transforms.push(`h_${height}`);

    return url.slice(0, idx + marker.length) + transforms.join(",") + "/" + after;
};
