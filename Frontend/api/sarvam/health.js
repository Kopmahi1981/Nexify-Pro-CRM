export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: "error",
      message: "Method Not Allowed",
    });
  }

  const configured =
    Boolean(process.env.SARVAM_API_KEY) &&
    Boolean(process.env.SARVAM_BASE_URL);

  return res.status(configured ? 200 : 500).json({
    status: configured ? "ok" : "error",
    service: "sarvam-proxy",
    configured,
  });
}