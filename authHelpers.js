const fs = require('fs');
const path = require('path');
const os = require('os');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BACKEND_URL = process.env.INSIGHTA_API_URL || 'http://localhost:3000';
const CREDENTIALS_PATH = path.join(os.homedir(), '.insighta', 'credentials.json');

function getCredentials() {
    if (!fs.existsSync(CREDENTIALS_PATH)) return null;
    return JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
}

function saveCredentials(access_token, refresh_token) {
    const dir = path.dirname(CREDENTIALS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify({ access_token, refresh_token }, null, 2));
}

function clearCredentials() {
    if (fs.existsSync(CREDENTIALS_PATH)) {
        fs.unlinkSync(CREDENTIALS_PATH);
    }
}

// Axios instance with interceptors for token refresh
const api = axios.create({
    baseURL: BACKEND_URL,
    headers: {
        'Accept': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    // Stage 3 constraint
    if (config.url.startsWith('/api/profiles')) {
        config.headers['X-API-Version'] = '1';
    }
    const creds = getCredentials();
    if (creds?.access_token) {
        config.headers['Authorization'] = `Bearer ${creds.access_token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const creds = getCredentials();
            if (creds?.refresh_token) {
                try {
                    const res = await axios.post(`${BACKEND_URL}/auth/refresh`, { refresh_token: creds.refresh_token });
                    saveCredentials(res.data.access_token, res.data.refresh_token);
                    originalRequest.headers['Authorization'] = `Bearer ${res.data.access_token}`;
                    return api(originalRequest);
                } catch (refreshErr) {
                    clearCredentials();
                    console.error("Session expired. Please run 'insighta login' again.");
                    process.exit(1);
                }
            } else {
                 console.error("Unauthenticated. Please run 'insighta login'.");
                 process.exit(1);
            }
        }
        return Promise.reject(error);
    }
);

module.exports = {
    api,
    getCredentials,
    saveCredentials,
    clearCredentials,
    BACKEND_URL
};
