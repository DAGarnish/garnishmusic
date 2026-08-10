import fs from "fs";

let content = fs.readFileSync("mastering-973.txt", "utf8");
console.log("--- ORIGINAL ---");
console.log(content.substring(content.indexOf("36 hours or 20 hours"), content.indexOf("Use the ‘CONNECT’ button")));

const localCurrency = "EU"; // test for Lisbon
const toDelete = ["USA", "EU", "UK"].filter(c => c !== localCurrency);

for (const prefix of toDelete) {
    const regex = new RegExp(`<(p|div|h[1-6])[^>]*>(?:(?!<\\/\\1>)[\\s\\S])*?\\b${prefix}:\\s*(?:\\$|€|£|\\d)(?:(?!<\\/\\1>)[\\s\\S])*?<\\/\\1>\\s*`, 'gi');
    content = content.replace(regex, '');
}

const keepRegex = new RegExp(`(<(?:p|div|h[1-6])[^>]*>(?:<[^>]+>)*\\s*)\\b${localCurrency}:\\s*`, 'gi');
content = content.replace(keepRegex, '$1');

console.log("--- MODIFIED ---");
console.log(content.substring(content.indexOf("36 hours or 20 hours"), content.indexOf("Use the ‘CONNECT’ button")));

