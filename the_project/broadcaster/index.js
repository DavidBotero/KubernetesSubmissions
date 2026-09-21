const { connect, StringCodec } = require('nats')

const NATS_URL = process.env.NATS_URL
const NAMESPACE = process.env.NAMESPACE || 'default'
const WEBHOOK_URL = process.env.WEBHOOK_URL

const codec = StringCodec()

const forward = async (payload) => {
  const response = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user: payload.user,
      message: `${payload.message}: ${payload.todo.content}`,
    }),
  })
  if (!response.ok) {
    throw new Error(`webhook responded with ${response.status}`)
  }
}

const main = async () => {
  const nats = await connect({ servers: NATS_URL, waitOnFirstConnect: true, maxReconnectAttempts: -1 })
  console.log('connected to NATS')

  // every replica joins the same queue group, so each message reaches only one of them
  const subscription = nats.subscribe(`todos.${NAMESPACE}`, { queue: 'broadcaster' })

  for await (const message of subscription) {
    const payload = JSON.parse(codec.decode(message.data))
    console.log(`${payload.message}: ${payload.todo.content}`)

    if (!WEBHOOK_URL) continue

    try {
      await forward(payload)
    } catch (e) {
      console.log(`could not forward the message: ${e.message}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
