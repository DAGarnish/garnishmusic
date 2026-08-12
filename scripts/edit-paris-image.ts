import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function main() {
  const worker = await createWorker('eng');
  const ret = await worker.recognize('paris.png');
  
  const boxes = [];
  
  for (const word of ret.data.words) {
    if (word.text.includes('2013')) {
      console.log(`Found 2013 at ${word.bbox.x0}, ${word.bbox.y0}, ${word.bbox.x1}, ${word.bbox.y1}`);
      boxes.push(word.bbox);
    } else if (word.text.includes(',')) {
      // Check if it's the comma right before 2013
      const wordIndex = ret.data.words.indexOf(word);
      if (wordIndex < ret.data.words.length - 1 && ret.data.words[wordIndex + 1].text.includes('2013')) {
        boxes.push(word.bbox);
      }
    }
  }
  
  await worker.terminate();

  let img = sharp('paris.png');
  const metadata = await img.metadata();
  
  const overlays = boxes.map(bbox => {
      // expand bounding box slightly to ensure it covers the text completely
      const width = bbox.x1 - bbox.x0 + 10;
      const height = bbox.y1 - bbox.y0 + 10;
      return {
          input: {
              create: {
                  width: width,
                  height: height,
                  channels: 4,
                  background: { r: 255, g: 255, b: 255, alpha: 1 }
              }
          },
          top: Math.max(0, bbox.y0 - 5),
          left: Math.max(0, bbox.x0 - 5)
      };
  });
  
  if (overlays.length > 0) {
      await img.composite(overlays).toFile('paris_edited.png');
      console.log(`Edited image saved with ${overlays.length} white boxes.`);
  } else {
      console.log('No 2013 found.');
  }
}

main().catch(console.error);
