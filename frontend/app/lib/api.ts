export async function apiFetch(url: string, options: any = {}) {
  const token = localStorage.getItem("accessToken");

  const res = await fetch(`http://localhost:3000${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "API error");
  }

  return data;
}