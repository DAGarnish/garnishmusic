import { getPayloadClient } from "../lib/get-payload";

async function fixTypo() {
  const payload = await getPayloadClient();
  
  const products = await payload.find({
    collection: "products",
    limit: 1000,
  });
  
  for (const doc of products.docs) {
    let changed = false;
    const newAttributes = (doc.attributes || []).map((attr: any) => {
      if (attr.name && attr.name.includes("whcih")) {
        attr.name = attr.name.replace(/whcih/g, "which").replace(/schedule you'd like/g, "schedule letter you'd like");
        changed = true;
      }
      if (attr.options && attr.options.includes("whcih")) {
        attr.options = attr.options.replace(/whcih/g, "which").replace(/schedule you'd like/g, "schedule letter you'd like");
        changed = true;
      }
      return attr;
    });
    
    if (changed) {
      await payload.update({
        collection: "products",
        id: doc.id,
        data: {
          attributes: newAttributes,
        },
      });
      console.log(`Updated product attributes: ${doc.title || doc.name}`);
    }
    
    let varChanged = false;
    const newVariations = (doc.variations || []).map((variation: any) => {
      let vChanged = false;
      const vAttrs = (variation.attributes || []).map((attr: any) => {
        if (attr.attributeName && attr.attributeName.includes("whcih")) {
          attr.attributeName = attr.attributeName.replace(/whcih/g, "which").replace(/schedule you'd like/g, "schedule letter you'd like");
          vChanged = true;
        }
        if (attr.attributeValue && attr.attributeValue.includes("whcih")) {
          attr.attributeValue = attr.attributeValue.replace(/whcih/g, "which").replace(/schedule you'd like/g, "schedule letter you'd like");
          vChanged = true;
        }
        return attr;
      });
      if (vChanged) {
        varChanged = true;
        variation.attributes = vAttrs;
      }
      return variation;
    });
    
    if (varChanged) {
      await payload.update({
        collection: "products",
        id: doc.id,
        data: {
          variations: newVariations,
        },
      });
      console.log(`Updated product variations: ${doc.title || doc.name}`);
    }
  }
  
  console.log("Done checking product attributes!");
  process.exit(0);
}

fixTypo().catch(console.error);
