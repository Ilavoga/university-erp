import { openAsBlob } from 'node:fs';
import path from 'node:path';

const baseUrl = "http://localhost:3000";

async function upload(email, password, filePath) {
  try {
    // Helper to parse Set-Cookie headers and extract name=value
    const parseCookies = (cookieHeaders) => {
        return cookieHeaders.map(header => header.split(';')[0]).join('; ');
    };

    // 1. Get CSRF
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const { csrfToken } = await csrfRes.json();
    
    const csrfCookies = csrfRes.headers.getSetCookie();
    const csrfCookieString = parseCookies(csrfCookies);

    // console.log('CSRF Token:', csrfToken);
    // console.log('CSRF Cookies:', csrfCookieString);

    // 2. Login
    const loginBody = new URLSearchParams({
      csrfToken,
      email,
      password,
      redirect: "false",
      callbackUrl: baseUrl,
      json: "true"
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Cookie': csrfCookieString,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: loginBody,
      redirect: 'manual'
    });

    if (loginRes.status !== 200 && loginRes.status !== 302 && loginRes.status !== 303) {
        console.error('Login Status:', loginRes.status);
        console.error('Login Text:', await loginRes.text());
        throw new Error('Login failed');
    }
    
    // If it's a redirect, the cookies are on this response.
    // If it's JSON (200), the cookies are on this response.
    
    // Merge cookies
    const loginCookies = loginRes.headers.getSetCookie();
    
    // Combine all cookies (CSRF + Session)
    // Note: If login response updates CSRF cookie, we should use the new one.
    // But usually it just sets the session cookie.
    const allSetCookies = [...csrfCookies, ...loginCookies];
    const cookieHeader = parseCookies(allSetCookies);

    // console.log('Cookie Header for Upload:', cookieHeader);

    // 3. Upload
    const blob = await openAsBlob(filePath);
    const filename = path.basename(filePath);
    const type = filename.endsWith('.jpg') || filename.endsWith('.jpeg') ? 'image/jpeg' : 'image/png';
    
    const file = new File([blob], filename, { type });
    
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch(`${baseUrl}/api/upload`, {
      method: 'POST',
      headers: {
        'Cookie': cookieHeader
      },
      body: formData
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload failed: ${uploadRes.status} ${text}`);
    }

    const data = await uploadRes.json();
    console.log(JSON.stringify(data));

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

const [,, email, password, filePath] = process.argv;
if (!email || !password || !filePath) {
    console.error("Usage: node upload-image.js <email> <password> <filePath>");
    process.exit(1);
}

upload(email, password, filePath);
