/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep build tracing inside this app even when parent folders have lockfiles.
  outputFileTracingRoot: __dirname,
};

module.exports = nextConfig;
