export async function uploadImageToS3(file, folder) {
  const body = {
    action: "GET_UPLOAD_URL",
    folder: folder,
    session_id: localStorage.getItem("session_id"),
    filename: file.name,
    content_type: file.type
  };

  const IS_DEV = import.meta.env.VITE_IS_DEV === '1' ? 1 : 0;

  const response = await fetch("https://0oydlyiauf.execute-api.ap-south-1.amazonaws.com/default/wagnwonder-services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
          ...body,
          is_dev: IS_DEV
      })
  });

  // console.log("Upload URL response:", response);
  const data = await response.json();

  if (!data.success && data.status_code === 498) {
    alert("Session expired. Please login again.");
    localStorage.clear();
    window.location.href = "/login.html";
    return;
  }

  const { upload_url, final_url } = data;

  const upload = await fetch(upload_url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

  if (!upload.ok) throw new Error("Failed to upload image to S3");

  return final_url;
}
