const fs = require('fs')
const pngToIco = require('png-to-ico').default

async function main() {
  const buf = await pngToIco('resources/icon.png')
  fs.writeFileSync('resources/icon.ico', buf)
  console.log('Generated resources/icon.ico')
}

main().catch(console.error)
