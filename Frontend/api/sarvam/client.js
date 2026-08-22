const BASE_URL = process.env.SARVAM_BASE_URL;
const API_KEY = process.env.SARVAM_API_KEY;

if (!BASE_URL) {
  throw new Error("Missing SARVAM_BASE_URL");
}

if (!API_KEY) {
  throw new Error("Missing SARVAM_API_KEY");
}

export async function sarvamRequest(
  endpoint,
  {
    method = "POST",
    headers = {},
    body,
    isFormData = false,
  } = {}
) {
  const requestHeaders = {
    "api-subscription-key": API_KEY,
    Accept: "application/json",
    ...headers,
  };

  // Let fetch generate the multipart boundary automatically
  if (!isFormData) {
    requestHeaders["Content-Type"] = "application/json";
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: requestHeaders,
    body,
  });

  let data;

  try {
    data = await response.json();
  } catch {
    data = await response.text();
  }

  if (!response.ok) {
    throw new Error(
      JSON.stringify({
        status: response.status,
        data,
      })
    );
  }

  return data;
}