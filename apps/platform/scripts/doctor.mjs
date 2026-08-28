/** Preflight check: finds the usual local-setup problems and says how to fix them. */
import fs from 'fs'
import net from 'net'

let problems = 0
const ok = (m) => console.log('  OK   ' + m)
const bad = (m, fix) => { problems++; console.log('  FAIL ' + m + '\n       -> ' + fix) }

console.log('\nTender Platform — setup check\n')

// 1. Node version
const major = Number(process.versions.node.split('.')[0])
const minor = Number(process.versions.node.split('.')[1])
if (major > 20 || (major === 20 && minor >= 9)) ok(`Node ${process.versions.node}`)
else bad(`Node ${process.versions.node} is too old (need 20.9 or newer)`,
        'Install Node 22 LTS from https://nodejs.org then run this again')

// 2. Right directory
if (fs.existsSync('package.json') && JSON.parse(fs.readFileSync('package.json')).name === 'tender-platform') {
  ok('Running from apps/platform')
} else {
  bad('Wrong directory', 'cd into bi-tender/apps/platform first')
}

// 3. Dependencies
if (fs.existsSync('node_modules/next')) ok('Dependencies installed')
else bad('Dependencies missing', 'Run: npm install')

// 4. Env file
if (!fs.existsSync('.env')) {
  bad('.env missing', 'Run: cp .env.example .env')
} else {
  const env = fs.readFileSync('.env', 'utf8')
  const secret = /^PAYLOAD_SECRET=(.+)$/m.exec(env)
  const db = /^DATABASE_URI=(.+)$/m.exec(env)
  if (secret && secret[1].trim()) ok('PAYLOAD_SECRET set')
  else bad('PAYLOAD_SECRET is empty in .env', 'Run: cp .env.example .env   (overwrites it with working defaults)')
  if (db && db[1].trim()) ok(`DATABASE_URI set (${db[1].trim()})`)
  else bad('DATABASE_URI is empty in .env', 'Run: cp .env.example .env')
}

// 5. Database seeded
if (fs.existsSync('tender-platform.db')) ok('Local database exists')
else console.log('  NOTE Local database not created yet\n       -> Run: npm run seed')

// 6. Port availability
const server = net.createServer()
server.once('error', () => {
  bad('Port 3000 is already in use',
      'Stop whatever is using it, or run: npx next dev -p 3001')
  finish()
})
server.once('listening', () => { server.close(); ok('Port 3000 is free'); finish() })
server.listen(3000, '127.0.0.1')

function finish() {
  if (problems === 0) {
    console.log('\nAll checks passed. Start the app with:  npm run dev')
    console.log('Then open http://localhost:3000/admin  (demo@tenderiq.test / demo1234)\n')
  } else {
    console.log(`\n${problems} problem(s) found — fix the lines marked FAIL above, then run: npm run doctor\n`)
  }
}
