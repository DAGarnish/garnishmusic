import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

async function main() {
  const worker = await createWorker('eng');
  const ret = await worker.recognize('paris.png');
  const hocr = ret.data.hocr;
  await worker.terminate();
  
  if (!hocr) {
      console.log("No hocr output");
      process.exit(1);
  }

  // Parse hocr for bbox
  const regex = /<span class=['"]ocrx_word['"] title=['"]bbox (\\d+) (\\d+) (\\d+) (\\d+)[^>]*>([^<]+)<\/span>/g;
  let match;
  const boxes = [];
  
  let previousWord = null;

  while ((match = regex.exec(hocr)) !== null) {
      const x0 = parseInt(match[1]);
      const y0 = parseInt(match[2]);
      const x1 = parseInt(match[3]);
      const y1 = parseInt(match[4]);
      const text = match[5];
      
      if (text.includes('2013')) {
          console.log(`Found 2013: ${x0}, ${y0}, ${x1}, ${y1}`);
          boxes.push({x0, y0, x1, y1});
          if (previousWord && (previousWord.text === ',' || previousWord.text.includes(','))) {
              boxes.push(previousWord);
          }
      }
      
      previousWord = {x0, y0, x1, y1, text};
  }

  let img = sharp('paris.png');
  const metadata = await img.metadata();
  
  const overlays = boxes.map(bbox => {
      // expand bounding box slightly
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
