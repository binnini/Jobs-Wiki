import { createValidationError } from "../http/errors.js"

export function validateDocumentId(documentId) {
  if (typeof documentId !== "string" || documentId.trim() === "") {
    throw createValidationError("`documentId` path parameter is required.")
  }

  return documentId.trim()
}

function validateOptionalString(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (typeof value !== "string") {
    throw createValidationError(`\`${fieldName}\` must be a string.`)
  }

  const normalized = value.trim()
  return normalized === "" ? undefined : normalized
}

function validateStringArray(value, fieldName) {
  if (value === undefined) {
    return undefined
  }

  if (!Array.isArray(value)) {
    throw createValidationError(`\`${fieldName}\` must be an array of strings.`)
  }

  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.trim() === "") {
      throw createValidationError(`\`${fieldName}[${index}]\` must be a non-empty string.`)
    }

    return entry.trim()
  })
}

export function validateCreateDocumentRequest(body = {}) {
  const layer = validateOptionalString(body.layer, "layer")

  if (!["personal_raw", "personal_wiki"].includes(layer ?? "")) {
    throw createValidationError("`layer` must be `personal_raw` or `personal_wiki`.")
  }

  const title = validateOptionalString(body.title, "title")

  if (!title) {
    throw createValidationError("`title` is required.")
  }

  const bodyMarkdown = validateOptionalString(body.bodyMarkdown, "bodyMarkdown")
  const assetRefs = validateStringArray(body.assetRefs, "assetRefs")
  const kind = validateOptionalString(body.kind, "kind") ?? "note"

  if (!bodyMarkdown && (!assetRefs || assetRefs.length === 0)) {
    throw createValidationError(
      "Create requires `bodyMarkdown` or at least one `assetRefs` entry.",
    )
  }

  return {
    layer,
    subspace: layer === "personal_wiki" ? "wiki" : "raw",
    kind,
    title,
    bodyMarkdown,
    assetRefs: assetRefs ?? [],
  }
}

export function validateUpdateDocumentRequest(body = {}) {
  const title = validateOptionalString(body.title, "title")
  const bodyMarkdown =
    typeof body.bodyMarkdown === "string"
      ? body.bodyMarkdown
      : body.bodyMarkdown === undefined
        ? undefined
        : (() => {
            throw createValidationError("`bodyMarkdown` must be a string.")
          })()
  const assetRefs = validateStringArray(body.assetRefs, "assetRefs")
  const ifVersion = Number(body.ifVersion)

  if (!Number.isInteger(ifVersion) || ifVersion <= 0) {
    throw createValidationError("`ifVersion` must be a positive integer.")
  }

  if (title === undefined && bodyMarkdown === undefined && assetRefs === undefined) {
    throw createValidationError(
      "Update requires at least one mutable field: `title`, `bodyMarkdown`, or `assetRefs`.",
    )
  }

  return {
    ifVersion,
    title,
    bodyMarkdown,
    assetRefs,
  }
}

export function validateDeleteDocumentRequest(body = {}) {
  const ifVersion = Number(body.ifVersion)

  if (!Number.isInteger(ifVersion) || ifVersion <= 0) {
    throw createValidationError("`ifVersion` must be a positive integer.")
  }

  return {
    ifVersion,
  }
}

export function validateRegisterAssetRequest(body = {}) {
  const filename = validateOptionalString(body.filename, "filename")
  const mediaType = validateOptionalString(body.mediaType, "mediaType")
  const storageRef = validateOptionalString(body.storageRef, "storageRef")
  const assetKind = validateOptionalString(body.assetKind, "assetKind") ?? "file"

  if (!filename || !mediaType || !storageRef) {
    throw createValidationError(
      "`filename`, `mediaType`, and `storageRef` are required.",
    )
  }

  return {
    filename,
    mediaType,
    storageRef,
    assetKind,
  }
}
