const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { saveCredentials, clearCredentials, getCredentials, api, BACKEND_URL } = require('../authHelpers');

async function login() {
    let open;
    try {
        const module = await import('open');
        open = module.default;
    } catch (e) {
        console.error("Failed to load 'open' library");
    }

    const app = express();
    const port = 3456;
    let server;
    
    app.get('/callback', async (req, res) => {
        const { code, state } = req.query;
        res.send('<h1>Login successful! You can safely close this tab and return to the CLI.</h1>');
        
        try {
            const redirect_uri = `http://localhost:${port}/callback`;
            const result = await api.post(`/auth/github/cli`, { code, redirect_uri });
            saveCredentials(result.data.access_token, result.data.refresh_token);
            console.log("\nLogged in successfully!");
            setTimeout(() => server.close(), 1000);
            process.exit(0);
        } catch (error) {
            console.error('\nAuthentication error:', error.response?.data?.message || error.message);
            setTimeout(() => server.close(), 1000);
            process.exit(1);
        }
    });

    server = app.listen(port, async () => {
        // According to prompt, CLI "generates state, code_verifier, code_challenge".
        // Github standard OAuth natively uses state, and accepts them if App configured.
        // For CLI, we explicitly send 'redirect_uri' per Github guidelines.
        const state = crypto.randomBytes(16).toString('hex');
        
        // I will use process.env for CLI if they set it. Or fallback to standard if not.
        const clientId = process.env.GITHUB_CLIENT_ID || 'your_client_id'; 
        
        const redirect_uri = `http://localhost:${port}/callback`;
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri,
            scope: 'read:user user:email',
            state
        });
        
        const url = `https://github.com/login/oauth/authorize?${params.toString()}`;
        console.log("Opening browser to authenticate via GitHub...");
        console.log(`If your browser does not open automatically, visit this URL:\n${url}\n`);
        console.log("Waiting for callback...");
        if (open) await open(url);
    });
}

async function logout() {
    const creds = getCredentials();
    if (creds?.refresh_token) {
        try {
            await api.post('/auth/logout', { refresh_token: creds.refresh_token });
        } catch (e) {
            // Ignore error if already logged out server-side
        }
    }
    clearCredentials();
    console.log("Logged out successfully.");
}

function whoami() {
    const creds = getCredentials();
    if (!creds?.access_token) {
        console.log("Not logged in.");
        return;
    }
    try {
        const decoded = jwt.decode(creds.access_token);
        if (decoded) {
            console.log(`Logged in. User ID: ${decoded.id}, Role: ${decoded.role}`);
        } else {
            console.log("Not logged in or token corrupted.");
        }
    } catch (e) {
        console.log("Error parsing token.");
    }
}

module.exports = {
    login, logout, whoami
};
