import { Hono } from '@/hono'
import { basicAuth } from '@/middleware/basic-auth'
import { SHA256 } from 'crypto-js'

describe('Basic Auth by Middleware', () => {
  const crypto = global.crypto
  beforeAll(() => {
    global.crypto = require('crypto').webcrypto
  })
  afterAll(() => {
    global.crypto = crypto
  })

  const app = new Hono()

  const username = 'hono-user-a'
  const password = 'hono-password-a'
  const unicodePassword = '炎'

  const usernameB = 'hono-user-b'
  const passwordB = 'hono-password-b'

  const usernameC = 'hono-user-c'
  const passwordC = 'hono-password-c'

  app.use(
    '/auth/*',
    basicAuth({
      username,
      password,
    })
  )

  app.use(
    '/auth-unicode/*',
    basicAuth({
      username: username,
      password: unicodePassword,
    })
  )

  app.use(
    '/auth-multi/*',
    basicAuth(
      {
        username: usernameB,
        password: passwordB,
      },
      {
        username: usernameC,
        password: passwordC,
      }
    )
  )

  app.use(
    '/auth-override-func/*',
    basicAuth({
      username: username,
      password: password,
      hashFunction: (data: string) => SHA256(data).toString(),
    })
  )

  app.get('/auth/*', () => new Response('auth'))
  app.get('/auth-unicode/*', () => new Response('auth'))
  app.get('/auth-multi/*', () => new Response('auth'))
  app.get('/auth-override-func/*', () => new Response('auth'))

  it('Unauthorized', async () => {
    const req = new Request('http://localhost/auth/a')
    const res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(401)
    expect(await res.text()).toBe('Unauthorized')
  })

  it('Authorizated', async () => {
    const credential = Buffer.from(username + ':' + password).toString('base64')

    const req = new Request('http://localhost/auth/a')
    req.headers.set('Authorization', `Basic ${credential}`)
    const res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('auth')
  })

  it('Authorizated Unicode', async () => {
    const credential = Buffer.from(username + ':' + unicodePassword).toString('base64')

    const req = new Request('http://localhost/auth-unicode/a')
    req.headers.set('Authorization', `Basic ${credential}`)
    const res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('auth')
  })

  it('Authorizated multiple users', async () => {
    let credential = Buffer.from(usernameB + ':' + passwordB).toString('base64')

    let req = new Request('http://localhost/auth-multi/b')
    req.headers.set('Authorization', `Basic ${credential}`)
    let res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('auth')

    credential = Buffer.from(usernameC + ':' + passwordC).toString('base64')
    req = new Request('http://localhost/auth-multi/c')
    req.headers.set('Authorization', `Basic ${credential}`)
    res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('auth')
  })

  it('should authorize with sha256 function override', async () => {
    const credential = Buffer.from(username + ':' + password).toString('base64')

    const req = new Request('http://localhost/auth-override-func/a')
    req.headers.set('Authorization', `Basic ${credential}`)
    const res = await app.dispatch(req)
    expect(res).not.toBeNull()
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('auth')
  })
})