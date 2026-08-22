export function methodNotAllowed(res) {
  return res.status(405).json({
    status: "error",
    message: "Method Not Allowed",
  });
}

export function badRequest(res, message) {
  return res.status(400).json({
    status: "error",
    message,
  });
}

export function serverError(res, error) {
  console.error(error);

  return res.status(500).json({
    status: "error",
    message: error.message || "Internal Server Error",
  });
}