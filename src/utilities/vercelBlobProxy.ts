import path from 'path'
import type { PayloadRequest } from 'payload'

const cacheControlMaxAge = 60 * 60 * 24 * 365

const getBlobStoreId = (token: string): string | null =>
  token.match(/^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i)?.[1]?.toLowerCase() ?? null

export const vercelBlobProxy = async (
  req: PayloadRequest,
  args: {
    doc: { id: number | string }
    headers?: Headers
    params: {
      clientUploadContext?: unknown
      collection: string
      filename: string
      prefix?: string
    }
  },
): Promise<Response> => {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  const storeId = token ? getBlobStoreId(token) : null
  if (!token || !storeId) {
    req.payload.logger.error({ msg: 'Vercel Blob proxy: missing or invalid BLOB_READ_WRITE_TOKEN' })
    return new Response('Internal Server Error', { status: 500 })
  }

  const { filename, prefix } = args.params
  const fileKey = [prefix, filename].filter(Boolean).join('/')

  const dir = path.posix.dirname(fileKey)
  const encodedFilename = encodeURIComponent(path.posix.basename(fileKey))
  const encodedPath = dir === '.' ? encodedFilename : path.posix.join(dir, encodedFilename)

  const fileUrl = `https://${storeId}.private.blob.vercel-storage.com/${encodedPath}`

  const rangeHeader = req.headers.get('range')
  const ifNoneMatchHeader = req.headers.get('if-none-match')

  let response: Response
  try {
    response = await fetch(fileUrl, {
      headers: {
        authorization: `Bearer ${token}`,
        ...(rangeHeader ? { range: rangeHeader } : {}),
        ...(ifNoneMatchHeader ? { 'if-none-match': ifNoneMatchHeader } : {}),
      },
    })
  } catch (err) {
    req.payload.logger.error({ err, msg: 'Unexpected error proxying Vercel Blob file' })
    return new Response('Internal Server Error', { status: 500 })
  }

  if (response.status === 404) {
    return new Response(null, { status: 404 })
  }

  if (response.status === 304) {
    return new Response(null, { status: 304 })
  }

  if (!response.ok) {
    req.payload.logger.error({
      msg: `Vercel Blob proxy: upstream returned ${response.status} ${response.statusText}`,
    })
    return new Response(null, { status: 502 })
  }

  const responseHeaders = new Headers()
  responseHeaders.set(
    'Content-Type',
    response.headers.get('content-type') ?? 'application/octet-stream',
  )
  if (response.headers.has('content-length')) {
    responseHeaders.set('Content-Length', response.headers.get('content-length')!)
  }
  if (response.headers.has('content-disposition')) {
    responseHeaders.set('Content-Disposition', response.headers.get('content-disposition')!)
  }
  if (response.headers.has('etag')) {
    responseHeaders.set('ETag', response.headers.get('etag')!)
  }
  if (response.headers.has('last-modified')) {
    responseHeaders.set('Last-Modified', response.headers.get('last-modified')!)
  }
  responseHeaders.set('Cache-Control', `public, max-age=${cacheControlMaxAge}`)
  responseHeaders.set('Accept-Ranges', 'bytes')
  const contentRange = response.headers.get('content-range')
  if (contentRange) {
    responseHeaders.set('Content-Range', contentRange)
  }

  return new Response(response.body, {
    headers: responseHeaders,
    status: contentRange ? 206 : response.status,
  })
}