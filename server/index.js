/**
 * Retrace — Express API Server
 *
 * Entry point for the Node.js/Express backend.
 * This server acts as the BFF (Backend For Frontend) layer between
 * the React UI and the Python FastAPI microservice that runs the
 * adaptive ML reconstruction pipeline.
 *
 * Architecture:
 * React UI  ──►  Express (this server, :3001)  ──►  FastAPI ML Service (:8000)
 * └►  PostgreSQL DB
 */

const express = require('express')
const cors = require('cors')
const path = require('path')

// Load environment variables from the root Sleekops workspace
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const ingestRouter = require('./routes/ingest')
const shipmentsRouter = require('./routes/shipments')
const analyticsRouter = require('./routes/analytics')
const authRouter = require('./routes/auth') // 🔑 1. IMPORT YOUR NEW AUTH BRIDGING ROUTER

const app = express()
const PORT = process.env.PORT || 3001

// 🛡️ DYNAMIC PRODUCTION CORS INTEGRATION
const allowedOrigins = [
  'http://localhost:5173',          // Local Vite Development Environment
  'http://127.0.0.1:5173',
  'https://sleekops.vercel.app'     // Live Production Frontend Workspace
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow server-to-server or tools like Postman (which have an undefined origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Mount routers
app.use('/api/ingest', ingestRouter)
app.use('/api/shipments', shipmentsRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/auth', authRouter) // 🔑 2. MOUNT THE AUTH MODULE PIPELINE TO /api/auth

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '2.4.1', service: 'retrace-api' })
})

app.listen(PORT, () => {
  console.log(`[Retrace API] Listening on port ${PORT}`)
})

module.exports = app