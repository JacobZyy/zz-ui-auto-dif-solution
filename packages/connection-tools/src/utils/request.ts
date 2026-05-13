import ky from 'ky'

const BASE_URL = 'https://uidiff.zhuanspirit.com'

const request = ky.create({
  prefixUrl: BASE_URL,
  timeout: 30000,
  retry: 0,
  credentials: 'include',
  hooks: {
    beforeRequest: [
      (request) => {
        console.log('🚀 ~ request:', request)
        console.log(`[Request] ${request.method} ${request.url}`)
      },
    ],
    afterResponse: [
      (_request, _options, response) => {
        console.log(`[Response] ${response.status} ${response.url}`)
        return response
      },
    ],
  },
})

export { request }
