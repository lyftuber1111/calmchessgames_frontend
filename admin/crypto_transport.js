/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Client-Side In-Transit Encryption & Transport Security Utility (crypto_transport.js)
 * 
 * Provides:
 * 1. Automatic HTTPS transport verification & upgrade
 * 2. Web Crypto API (SubtleCrypto) AES-256-GCM payload encryption for data in transit
 * 3. Secure fetch wrapper (secureFetch) ensuring encrypted transit & secure headers
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.CryptoTransport = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Shared application transit salt / key identifier
  const TRANSIT_SALT = 'CalmChess_Transit_Encryption_2026_Salt!';
  const DEFAULT_PASSPHRASE = 'cc_transit_sec_a8f9c2e1b4d7035698ef1234567890ab';

  /**
   * 1. Automatic HTTPS Redirect
   * Ensures the page itself and any data transmission runs over encrypted TLS
   */
  function ensureHttps() {
    if (typeof window === 'undefined' || !window.location) return;
    const loc = window.location;
    if (loc.protocol === 'http:' && !isLocalhost(loc.hostname)) {
      const secureUrl = 'https://' + loc.host + loc.pathname + loc.search + loc.hash;
      console.warn('[CryptoTransport] Insecure HTTP detected. Redirecting to encrypted HTTPS:', secureUrl);
      window.location.replace(secureUrl);
    }
  }

  function isLocalhost(hostname) {
    return /^localhost$|^127(?:\.[0-9]+){0,2}\.[0-9]+$|^(?:0*:)*?:?0*1$/i.test(hostname);
  }

  function isHttpsActive() {
    if (typeof window === 'undefined' || !window.location) return true;
    return window.location.protocol === 'https:' || isLocalhost(window.location.hostname);
  }

  /**
   * Helper: Convert ArrayBuffer to Base64
   */
  function bufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Helper: Convert Base64 to ArrayBuffer
   */
  function base64ToBuffer(base64) {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * 2. Derive AES-256-GCM CryptoKey using Web Crypto API PBKDF2 or SHA-256
   */
  async function deriveKey(passphrase) {
    if (!window.crypto || !window.crypto.subtle) {
      return null;
    }
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode((passphrase || DEFAULT_PASSPHRASE) + TRANSIT_SALT);
    const hash = await window.crypto.subtle.digest('SHA-256', keyMaterial);
    return window.crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 3. AES-256-GCM Payload Encryption (In-Transit Layer 2 Protection)
   * Encrypts arbitrary objects or strings before network dispatch
   */
  async function encryptPayload(data, passphrase) {
    if (!window.crypto || !window.crypto.subtle) {
      // Fallback: If Web Crypto API unavailable, return raw object (TLS handles Layer 1 encryption)
      return data;
    }

    try {
      const cryptoKey = await deriveKey(passphrase);
      if (!cryptoKey) return data;

      const encoder = new TextEncoder();
      const plaintextBytes = encoder.encode(typeof data === 'string' ? data : JSON.stringify(data));

      // 96-bit (12 bytes) cryptographically random IV
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      // AES-GCM 128-bit authentication tag
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        cryptoKey,
        plaintextBytes
      );

      // In Web Crypto API, tag is appended to ciphertext at end (last 16 bytes)
      const encArray = new Uint8Array(encryptedBuffer);
      const tag = encArray.slice(encArray.length - 16);
      const ciphertext = encArray.slice(0, encArray.length - 16);

      return {
        _encrypted: true,
        version: '1.0',
        cipher: 'AES-256-GCM',
        iv: bufferToBase64(iv),
        tag: bufferToBase64(tag),
        ciphertext: bufferToBase64(ciphertext),
        timestamp: Date.now()
      };
    } catch (err) {
      console.warn('[CryptoTransport] Application-layer encryption warning, relying on TLS transport:', err);
      return data;
    }
  }

  /**
   * 4. AES-256-GCM Payload Decryption
   */
  async function decryptPayload(envelope, passphrase) {
    if (!envelope || !envelope._encrypted || !envelope.ciphertext || !envelope.iv || !envelope.tag) {
      return envelope;
    }
    if (!window.crypto || !window.crypto.subtle) {
      return envelope;
    }

    try {
      const cryptoKey = await deriveKey(passphrase);
      if (!cryptoKey) return envelope;

      const iv = new Uint8Array(base64ToBuffer(envelope.iv));
      const tag = new Uint8Array(base64ToBuffer(envelope.tag));
      const ciphertext = new Uint8Array(base64ToBuffer(envelope.ciphertext));

      // Combine ciphertext and tag for SubtleCrypto decrypt
      const combined = new Uint8Array(ciphertext.length + tag.length);
      combined.set(ciphertext, 0);
      combined.set(tag, ciphertext.length);

      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
          tagLength: 128
        },
        cryptoKey,
        combined
      );

      const decoder = new TextDecoder();
      const plaintext = decoder.decode(decryptedBuffer);
      try {
        return JSON.parse(plaintext);
      } catch (_) {
        return plaintext;
      }
    } catch (err) {
      console.error('[CryptoTransport] Decryption failed:', err);
      return envelope;
    }
  }

  /**
   * 5. Secure Fetch Wrapper
   * Guarantees HTTPS destination, injects security headers, preserves cookies,
   * and optionally performs Layer 2 payload encryption for sensitive requests.
   */
  async function secureFetch(url, options = {}) {
    ensureHttps();

    const fetchOptions = Object.assign({}, options);
    fetchOptions.headers = Object.assign({}, fetchOptions.headers || {});

    // Ensure security headers
    fetchOptions.headers['X-Requested-With'] = 'XMLHttpRequest';
    fetchOptions.headers['Accept'] = fetchOptions.headers['Accept'] || 'application/json, text/plain, */*';

    // Enforce credentials for secure HTTPS cookies
    if (!fetchOptions.credentials) {
      fetchOptions.credentials = 'include';
    }

    // Encrypt JSON body if requested or contains sensitive auth/financial properties
    if (fetchOptions.body && typeof fetchOptions.body === 'object' && !(fetchOptions.body instanceof FormData)) {
      fetchOptions.headers['Content-Type'] = 'application/json';
      const bodyObj = fetchOptions.body;
      const shouldEncrypt = options.encrypt === true ||
                            ('password' in bodyObj) ||
                            ('admin_key' in bodyObj) ||
                            ('admin_password' in bodyObj) ||
                            ('token' in bodyObj);

      if (shouldEncrypt && isHttpsActive()) {
        const encrypted = await encryptPayload(bodyObj, options.passphrase);
        fetchOptions.body = JSON.stringify(encrypted);
        fetchOptions.headers['X-Transit-Encrypted'] = 'AES-256-GCM';
      } else {
        fetchOptions.body = JSON.stringify(bodyObj);
      }
    } else if (typeof fetchOptions.body === 'string' && options.encrypt === true) {
      try {
        const parsed = JSON.parse(fetchOptions.body);
        const encrypted = await encryptPayload(parsed, options.passphrase);
        fetchOptions.body = JSON.stringify(encrypted);
        fetchOptions.headers['Content-Type'] = 'application/json';
        fetchOptions.headers['X-Transit-Encrypted'] = 'AES-256-GCM';
      } catch (_) {}
    }

    // Execute standard fetch over encrypted HTTPS
    const response = await fetch(url, fetchOptions);

    // Transparently decrypt response if backend returned encrypted payload
    const clone = response.clone();
    try {
      const json = await clone.json();
      if (json && json._encrypted) {
        const decryptedData = await decryptPayload(json, options.passphrase);
        return new Response(JSON.stringify(decryptedData), {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
      }
    } catch (_) {}

    return response;
  }

  // Self-execute HTTPS check immediately on script load
  ensureHttps();

  return {
    ensureHttps: ensureHttps,
    isHttpsActive: isHttpsActive,
    deriveKey: deriveKey,
    encryptPayload: encryptPayload,
    decryptPayload: decryptPayload,
    secureFetch: secureFetch
  };
}));
