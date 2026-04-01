export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
}

/**
 * Read PROXY_URL from env and return a Playwright-compatible proxy config.
 * Supports format: http://user:pass@host:port or http://host:port
 */
export function getProxyConfig(): ProxyConfig | null {
  const proxyUrl = process.env.PROXY_URL;
  if (!proxyUrl) return null;

  try {
    const url = new URL(proxyUrl);
    const config: ProxyConfig = {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
    };

    if (url.username) {
      config.username = decodeURIComponent(url.username);
    }
    if (url.password) {
      config.password = decodeURIComponent(url.password);
    }

    return config;
  } catch (error) {
    console.error('Invalid PROXY_URL format:', error);
    return null;
  }
}

/**
 * For proxy services that support IP rotation via API endpoint,
 * trigger a new IP assignment.
 */
export async function rotateProxy(): Promise<boolean> {
  const rotateUrl = process.env.PROXY_ROTATE_URL;
  if (!rotateUrl) {
    console.log('No PROXY_ROTATE_URL configured, skipping rotation');
    return false;
  }

  try {
    const response = await fetch(rotateUrl, { method: 'GET' });
    if (response.ok) {
      console.log('Proxy IP rotated successfully');
      // Wait for the new IP to take effect
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return true;
    }
    console.error(`Proxy rotation failed: ${response.status}`);
    return false;
  } catch (error) {
    console.error('Proxy rotation error:', error);
    return false;
  }
}
