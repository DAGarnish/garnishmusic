import { getPayload } from "payload";
import config from "../payload.config";

import fs from "fs";
import path from "path";

const envPath = path.resolve(".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1]] = match[2];
    }
  });
}

function shiftDateString(dateStr) {
    const parts = dateStr.split("/");
    if (parts.length !== 2) return dateStr;
    const m = parseInt(parts[0], 10);
    const d = parseInt(parts[1], 10);
    
    const date26 = new Date(2026, m - 1, d);
    const date27 = new Date(date26.getTime() - 24 * 60 * 60 * 1000);
    
    return `${date27.getMonth() + 1}/${date27.getDate()}`;
}

function processLine(line) {
    return line.replace(/(\d{1,2}\/\d{1,2})\s*[–-]\s*(\d{1,2}\/\d{1,2})/, (match, p1, p2) => {
        const separator = match.includes("–") ? "–" : "-";
        return `${shiftDateString(p1)} ${separator} ${shiftDateString(p2)}`;
    });
}

async function main() {
  const payload = await getPayload({ config });
  
  const productsQuery = await payload.find({
      collection: "products",
      where: {
          slug: { equals: "product/electronic-dj-class" }
      },
  });
  
  const product = productsQuery.docs[0];
  if (!product) {
      console.error("Product not found");
      process.exit(1);
  }

  const raw = product.wpRawContent;
  
  const linesToMove = [
      "P) 1/3",
      "Q) 1/4",
      "R) 1/12",
      "H) 1/13",
      "T) 2/24",
      "A1) 3/2",
      "U) 3/18",
      "V) 4/7",
      "W) 5/4",
      "X) 5/9",
      "Y) 5/17",
      "B) 5/30",
      "Z) 6/22",
      "A) 6/23"
  ];
  
  const htmlLines = raw.split("\n");
  
  const newHtmlLines = [];
  const extractedLines = [];
  
  for (const line of htmlLines) {
      let isFirstHalf = false;
      for (const movePrefix of linesToMove) {
          if (line.includes(movePrefix)) {
              isFirstHalf = true;
              break;
          }
      }
      
      if (isFirstHalf) {
          extractedLines.push(processLine(line));
      } else {
          newHtmlLines.push(line);
      }
  }
  
  const insertIndex = newHtmlLines.findIndex(line => line.includes("[/mkd_accordion_tab]"));
  
  if (insertIndex !== -1) {
      const targetLine = newHtmlLines[insertIndex];
      const parts = targetLine.split("[/mkd_accordion_tab]");
      
      const beforeStr = parts[0];
      const afterStr = "[/mkd_accordion_tab]" + parts[1];
      
      newHtmlLines[insertIndex] = beforeStr;
      
      newHtmlLines.splice(insertIndex + 1, 0, `<p style="text-align: left;"><strong>2027</strong></p>`);
      for (let i = 0; i < extractedLines.length; i++) {
          newHtmlLines.splice(insertIndex + 2 + i, 0, extractedLines[i]);
      }
      newHtmlLines.splice(insertIndex + 2 + extractedLines.length, 0, afterStr);
  }
  
  const finalHtml = newHtmlLines.join("\n");
  
  await payload.update({
      collection: "products",
      id: product.id,
      data: {
          wpRawContent: finalHtml
      }
  });
  
  console.log("Updated product successfully!");
  process.exit(0);
}

main().catch(console.error);
