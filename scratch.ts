import { getPayloadClient } from "./lib/get-payload"

async function run() {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: "pages",
    where: { slug: { equals: "private-instruction" } }
  })
  
  if (res.docs.length > 0) {
    const doc = res.docs[0] as any
    if (doc.wpRawContent) {
      require("fs").writeFileSync("private-instruction.txt", doc.wpRawContent)
      console.log("Saved to private-instruction.txt")
    }
  }
}
run()
