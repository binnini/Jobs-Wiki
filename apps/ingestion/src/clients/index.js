export function createClients(env) {
  return {
    stratawiki: {
      baseUrl: env.stratawikiBaseUrl,
      configured: Boolean(env.stratawikiBaseUrl),
    },
  }
}
