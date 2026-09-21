const https = require('https')
const fs = require('fs')

const API_HOST = process.env.KUBERNETES_SERVICE_HOST
const API_PORT = process.env.KUBERNETES_SERVICE_PORT
const SERVICE_ACCOUNT = '/var/run/secrets/kubernetes.io/serviceaccount'

const agent = new https.Agent({ ca: fs.readFileSync(`${SERVICE_ACCOUNT}/ca.crt`) })
const token = () => fs.readFileSync(`${SERVICE_ACCOUNT}/token`, 'utf-8').trim()

const options = (method, path, extraHeaders = {}) => ({
  host: API_HOST,
  port: API_PORT,
  path,
  method,
  agent,
  headers: { Authorization: `Bearer ${token()}`, ...extraHeaders },
})

const request = (method, path, body) => new Promise((resolve, reject) => {
  const payload = body ? JSON.stringify(body) : undefined
  const headers = payload
    ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    : {}
  const req = https.request(options(method, path, headers), (res) => {
    let data = ''
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => resolve({ status: res.statusCode, body: data }))
  })
  req.on('error', reject)
  if (payload) req.write(payload)
  req.end()
})

const create = async (path, object) => {
  const res = await request('POST', path, object)
  if (res.status === 409) {
    console.log(`${object.kind} ${object.metadata.name} already exists`)
    return
  }
  if (res.status >= 300) {
    throw new Error(`creating ${object.kind} ${object.metadata.name} failed: ${res.status} ${res.body}`)
  }
  console.log(`created ${object.kind} ${object.metadata.name}`)
}

// resources created for a DummySite are owned by it, so deleting the DummySite deletes them too
const ownerReference = (site) => [{
  apiVersion: 'stable.dwk/v1',
  kind: 'DummySite',
  name: site.metadata.name,
  uid: site.metadata.uid,
  controller: true,
}]

const createDeployment = (site, name) => ({
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: { name, namespace: site.metadata.namespace, ownerReferences: ownerReference(site) },
  spec: {
    replicas: 1,
    selector: { matchLabels: { app: name } },
    template: {
      metadata: { labels: { app: name } },
      spec: {
        volumes: [{ name: 'www', emptyDir: {} }],
        // the init container downloads the page that nginx then serves
        initContainers: [{
          name: 'fetch-page',
          image: 'curlimages/curl:8.11.1',
          command: ['curl', '-sSL', '-A', 'dummysite-controller/1.0', '-o', '/www/index.html', site.spec.website_url],
          volumeMounts: [{ name: 'www', mountPath: '/www' }],
        }],
        containers: [{
          name: 'nginx',
          image: 'nginx:1.29-alpine',
          ports: [{ containerPort: 80 }],
          volumeMounts: [{ name: 'www', mountPath: '/usr/share/nginx/html' }],
        }],
      },
    },
  },
})

const createService = (site, name) => ({
  apiVersion: 'v1',
  kind: 'Service',
  metadata: { name, namespace: site.metadata.namespace, ownerReferences: ownerReference(site) },
  spec: {
    type: 'ClusterIP',
    selector: { app: name },
    ports: [{ port: 80, targetPort: 80 }],
  },
})

const reconcile = async (site) => {
  const { name, namespace } = site.metadata
  const resourceName = `dummysite-${name}`
  console.log(`DummySite ${name} in ${namespace}: copying ${site.spec.website_url}`)
  await create(`/apis/apps/v1/namespaces/${namespace}/deployments`, createDeployment(site, resourceName))
  await create(`/api/v1/namespaces/${namespace}/services`, createService(site, resourceName))
}

const handleEvent = async (event) => {
  const site = event.object
  if (event.type === 'ADDED') {
    try {
      await reconcile(site)
    } catch (e) {
      console.log(e.message)
    }
  }
  if (event.type === 'DELETED') {
    console.log(`DummySite ${site.metadata.name} deleted, its resources are removed by the garbage collector`)
  }
}

const watch = () => {
  const req = https.request(options('GET', '/apis/stable.dwk/v1/dummysites?watch=true'), (res) => {
    console.log(`watching DummySites (HTTP ${res.statusCode})`)
    let buffer = ''
    res.on('data', (chunk) => {
      buffer += chunk
      let newline
      while ((newline = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, newline).trim()
        buffer = buffer.slice(newline + 1)
        if (line) handleEvent(JSON.parse(line))
      }
    })
    // the API server closes long watches from time to time, so start again
    res.on('end', () => setTimeout(watch, 1000))
  })
  req.on('error', (e) => {
    console.log(`watch failed: ${e.message}`)
    setTimeout(watch, 5000)
  })
  req.end()
}

watch()
