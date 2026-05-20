/**
 * Retrace — Express API Server
 *
 * Entry point for the Node.js/Express backend.
 * This server acts as the BFF (Backend For Frontend) layer between
 * the React UI and the Python FastAPI microservice that runs the
 * adaptive ML reconstruction pipeline.
 *
 * Architecture:
 *   React UI  ──►  Express (this server, :3001)  ──►  FastAPI ML Service (:8000)
 *                                                  └►  PostgreSQL DB
 */

const express = require('express')
const cors = require('cors')
const path = require('path')

// Load environment variables from the root Sleekops workspace
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const ingestRouter = require('./routes/ingest')
const shipmentsRouter = require('./routes/shipments')
const analyticsRouter = require('./routes/analytics')

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount routers
app.use('/api/ingest', ingestRouter)
app.use('/api/shipments', shipmentsRouter)
app.use('/api/analytics', analyticsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.4.1', service: 'retrace-api' })
})

app.listen(PORT, () => {
  console.log(`[Retrace API] Listening on http://localhost:${PORT}`)
})

module.exports = app
