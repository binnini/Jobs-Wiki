import { randomUUID } from "node:crypto"
import { createAskAdapter } from "./adapters/ask/create-ask-adapter.js"
import { createCommandFacadeAdapter } from "./adapters/command-facade/create-command-facade-adapter.js"
import { createReadAuthorityAdapter } from "./adapters/read-authority/create-read-authority-adapter.js"
import { loadEnv } from "./config/env.js"
import { createNotFoundError } from "./http/errors.js"
import { handleError } from "./http/error-middleware.js"
import { createRequestContext } from "./http/request.js"
import { sendJson } from "./http/response.js"
import { createAdminRoutes } from "./routes/admin-routes.js"
import { createCalendarRoutes } from "./routes/calendar-routes.js"
import { createOpportunityRoutes } from "./routes/opportunity-routes.js"
import { createWorkspaceRoutes } from "./routes/workspace-routes.js"

function getHeaderValue(value) {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

function buildUserContext(headers) {
  const workspaceId = getHeaderValue(headers["x-workspace-id"])
  const profileId = getHeaderValue(headers["x-profile-id"])

  const userContext = Object.fromEntries(
    Object.entries({
      workspaceId,
      profileId,
    }).filter(([, value]) => value !== undefined),
  )

  return Object.keys(userContext).length > 0 ? userContext : undefined
}

function matchPath(pattern, pathname) {
  const patternParts = pattern.split("/").filter(Boolean)
  const pathParts = pathname.split("/").filter(Boolean)

  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params = {}

  for (let index = 0; index < patternParts.length; index += 1) {
    const patternPart = patternParts[index]
    const pathPart = pathParts[index]

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart)
      continue
    }

    if (patternPart !== pathPart) {
      return null
    }
  }

  return params
}

function findRoute(routes, method, pathname) {
  for (const route of routes) {
    if (route.method !== method) {
      continue
    }

    const params = matchPath(route.path, pathname)

    if (params) {
      return {
        route,
        params,
      }
    }
  }

  return null
}

function createAdapters(dataMode, env) {
  const readAuthority = createReadAuthorityAdapter({ mode: dataMode, env })

  return {
    readAuthority,
    askWorkspace: createAskAdapter({ mode: dataMode, env, readAuthority }),
    commandFacade: createCommandFacadeAdapter({ mode: dataMode, env }),
  }
}

export function createApp({ env: providedEnv } = {}) {
  const env = loadEnv(providedEnv)
  const adapters = createAdapters(env.dataMode, env)
  const logEvent = (payload) => {
    if (env.logLevel === "silent") {
      return
    }

    const printer = payload.level === "error" ? console.error : console.info
    printer(JSON.stringify(payload))
  }
  const routes = [
    ...createWorkspaceRoutes({ adapters }),
    ...createOpportunityRoutes({ adapters }),
    ...createCalendarRoutes({ adapters }),
    ...createAdminRoutes({ adapters }),
  ]

  return async function app(req, res) {
    const startedAt = Date.now()
    const requestId = getHeaderValue(req.headers["x-request-id"]) ?? randomUUID()
    res.setHeader("x-request-id", requestId)

    let routeName = "unmatched"

    try {
      const context = createRequestContext(req, { requestId })
      context.userContext = buildUserContext(req.headers)

      if (context.method === "GET" && context.pathname === "/health") {
        routeName = "health"
        sendJson(res, 200, {
          status: "ok",
          service: env.serviceName,
          dataMode: env.dataMode,
          uptimeSeconds: Math.round(process.uptime()),
        })

        logEvent({
          level: "info",
          event: "was.request.completed",
          requestId,
          method: context.method,
          path: context.pathname,
          routeName,
          status: 200,
          latencyMs: Date.now() - startedAt,
        })

        return
      }

      const matchedRoute = findRoute(routes, context.method, context.pathname)

      if (!matchedRoute) {
        throw createNotFoundError("Route not found.", {
          method: context.method,
          path: context.pathname,
        })
      }

      routeName = matchedRoute.route.name
      context.params = matchedRoute.params

      const response = await matchedRoute.route.handler(context)
      sendJson(res, response.status ?? 200, response.body)

      logEvent({
        level: "info",
        event: "was.request.completed",
        requestId,
        method: context.method,
        path: context.pathname,
        routeName,
        status: response.status ?? 200,
        latencyMs: Date.now() - startedAt,
      })
    } catch (error) {
      handleError({
        req,
        res,
        error,
        requestId,
        routeName,
        startedAt,
        logger: logEvent,
      })
    }
  }
}
