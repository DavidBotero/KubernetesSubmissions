const http = require('http')
const fs = require('fs')

const PORT = process.env.PORT || 3000
const IMAGE_PATH = '/usr/src/app/files/image.jpg'
const CACHE_MS = 10 * 60 * 1000

const isImageFresh = () => {
  try {
    const stat = fs.statSync(IMAGE_PATH)
    return Date.now() - stat.mtimeMs < CACHE_MS
  } catch (e) {
    return false
  }
}

const refreshImage = async () => {
  const response = await fetch('https://picsum.photos/1200')
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(IMAGE_PATH, buffer)
}

const ensureImage = async () => {
  if (!isImageFresh()) {
    await refreshImage()
  }
}

const server = http.createServer(async (req, res) => {
  if (req.url === '/image') {
    await ensureImage()
    const image = fs.readFileSync(IMAGE_PATH)
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.end(image)
    return
  }

  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <title>Todo App</title>
</head>
<body>
  <main>
    <div>
      <h1>The project App</h1>
      <img src="/image" alt="Kubeapp" width="300" />
      <form action="/todos" method="post">
        <input type="text" id="content" name="content" maxlength="140" required>
        <button type="submit">Create todo</button>
      </form>
      <ul>
        <li>Learn JavaScript</li>
        <li>Learn React</li>
        <li>Build a project</li>
      </ul>
      <p>DevOps with Kubernetes 2026</p>
    </div>
  </main>
</body>
</html>`)
})

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`)
})
