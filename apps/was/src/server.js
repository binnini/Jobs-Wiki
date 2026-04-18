import { createServer } from "node:http"
import { createApp } from "./app.js"
import { loadEnv } from "./config/env.js"

const env = loadEnv()
const app = createApp({ env })
const server = createServer(app)

server.on("error", (error) => {
  console.error(
    JSON.stringify({
      event: "was.server.start_failed",
      service: env.serviceName,
      host: env.host,
      port: env.port,
      dataMode: env.dataMode,
      code: error.code,
      message: error.message,
    }),
  )

  process.exitCode = 1
})

function shutdown(signal) {
  console.info(JSON.stringify({ event: "was.shutdown.requested", signal }))

  server.close((error) => {
    if (error) {
      console.error(
        JSON.stringify({
          event: "was.shutdown.failed",
          signal,
          message: error.message,
        }),
      )
      process.exitCode = 1
      return
    }

    console.info(JSON.stringify({ event: "was.shutdown.completed", signal }))
  })
}

server.listen(env.port, env.host, () => {
  console.info(
    JSON.stringify({
      event: "was.server.started",
      service: env.serviceName,
      host: env.host,
      port: env.port,
      dataMode: env.dataMode,
    }),
  )
})

process.on("SIGINT", () => shutdown("SIGINT"))
process.on("SIGTERM", () => shutdown("SIGTERM"))
