export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const dns = await import('node:dns');
    const net = await import('node:net');
    dns.setDefaultResultOrder('ipv4first');
    if (typeof net.setDefaultAutoSelectFamily === 'function') {
      net.setDefaultAutoSelectFamily(false);
    }
  }
}
