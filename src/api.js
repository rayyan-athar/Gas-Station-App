export const API_URL = "http://localhost:4000";

let authToken = null;
export function setToken(t) { authToken = t; localStorage.setItem('token', t); }
export function loadToken() { const t = localStorage.getItem('token'); authToken = t; return t; }
function authHeaders(extra = {}) {
    const h = { ...extra };
    if (authToken) h['Authorization'] = `Bearer ${authToken}`;
    return h;
}

// Auth API
export async function register(username, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) setToken(data.token);
    return data;
}
export async function login(username, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.token) setToken(data.token);
    return data;
}

// Products API
export async function getProducts() {
    const res = await fetch(`${API_URL}/products`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Products request failed: ${res.status}`);
    return res.json();
}

export async function addProduct(product) {
    const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(product)
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Add product failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

export async function updateProduct(id, product) {
    const res = await fetch(`${API_URL}/products/${id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(product)
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Update product failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

export async function deleteProduct(id) {
    const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Delete product failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

// CSV bulk import removed

// Associates API
export async function getAssociates() {
    const res = await fetch(`${API_URL}/associates`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Associates request failed: ${res.status}`);
    return res.json();
}

export async function addAssociate(associate) {
    const res = await fetch(`${API_URL}/associates`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(associate)
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Add associate failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

export async function updateAssociate(id, associate) {
    const res = await fetch(`${API_URL}/associates/${id}`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(associate)
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Update associate failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

export async function deleteAssociate(id) {
    const res = await fetch(`${API_URL}/associates/${id}`, {
        method: "DELETE",
        headers: authHeaders()
    });
    const body = await res.text();
    if (!res.ok) throw new Error(body || `Delete associate failed: ${res.status}`);
    return JSON.parse(body || '{}');
}

// Stations API
export async function getStations() {
    return fetch(`${API_URL}/stations`, { headers: authHeaders() }).then(res => res.json());
}

export async function refillStation(tankNumber, amount) {
    return fetch(`${API_URL}/stations/${tankNumber}/refill`, {
        method: "PUT",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ amount })
    });
}
