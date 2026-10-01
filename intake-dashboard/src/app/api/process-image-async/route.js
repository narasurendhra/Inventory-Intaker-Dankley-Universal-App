import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import vision from '@google-cloud/vision';
import path from 'path';
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


function cleanJSON(text) {
  let clean = text.trim();
  const firstBrace = clean.indexOf('{');
  const lastBrace = clean.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return clean.substring(firstBrace, lastBrace + 1);
  }
  const firstBracket = clean.indexOf('[');
  const lastBracket = clean.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return clean.substring(firstBracket, lastBracket + 1);
  }
  return clean;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images');
    const sessionId = formData.get('sessionId');
    const imageIndex = formData.get('imageIndex');
    const allowedCategories = formData.get('allowedCategories') || 'Flower, Preroll, Gummies';
    const liveBrands = formData.get('liveBrands') || '';

    if (!files || files.length === 0 || !sessionId || imageIndex === null || imageIndex === undefined) {
      return NextResponse.json({ error: 'Missing required parameters: images, sessionId, or imageIndex' }, { status: 400 });
    }

    const file = files[0];
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // 1. Run Google Cloud Vision OCR on this single image with retry and Gemini fallback
    const credPath = path.resolve(process.cwd(), 'dankley-ocr-key.json');
    const visionOptions = { fallback: true };
    if (fs.existsSync(credPath)) {
      visionOptions.keyFilename = credPath;
    }
    const visionClient = new vision.ImageAnnotatorClient(visionOptions);
    let ocrText = "(No text detected)";
    let logoBrands = "";

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const [result] = await visionClient.batchAnnotateImages({
          requests: [{
            image: { content: buffer },
            features: [
              { type: 'DOCUMENT_TEXT_DETECTION' },
              { type: 'LOGO_DETECTION' }
            ]
          }]
        });

        const response = result.responses?.[0];
        if (response && !response.error && response.fullTextAnnotation?.text) {
          ocrText = response.fullTextAnnotation.text;
          if (response.logoAnnotations && response.logoAnnotations.length > 0) {
            logoBrands = response.logoAnnotations.map(l => l.description).join(", ");
            ocrText = `[DETECTED BRAND LOGOS: ${logoBrands}]\n` + ocrText;
          }
          break;
        }
      } catch (ocrErr) {
        console.warn(`[process-image-async] OCR Attempt ${attempt} error for index ${imageIndex}:`, ocrErr.message);
      }
      if (attempt < 3) await new Promise(r => setTimeout(r, 600 * attempt));
    }

    // 1.1 Multimodal Manifest Detection & Fallback OCR
    let upperText = ocrText.toUpperCase();
    let isManifest = mimeType === 'application/pdf' || 
                       upperText.includes("MANIFEST") || 
                       upperText.includes("NAME OF PERSON TRANSPORTING") || 
                       upperText.includes("ORIGINATING ENTITY") || 
                       upperText.includes("PACKAGE | ACCEPTED") || 
                       upperText.includes("PACKAGE | SHIPPED") || 
                       upperText.includes("SOURCE PRODUCTION BATCH") || 
                       upperText.includes("DESTINATION") || 
                       upperText.includes("TRANSACTION NUMBER") || 
                       upperText.includes("ITEM NAME") || 
                       upperText.includes("SHIPPED");

    // If Google OCR was unreadable, or if not detected as manifest yet, check with Gemini Vision directly
    if (!isManifest || ocrText === "(No text detected)" || ocrText.length < 50) {
      try {
        const visionAiModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const checkPrompt = `Examine this image carefully.
1. Is it a printed paper Metrc transport / shipping manifest document? (Answer YES or NO)
2. Transcribe all text visible on this image.
Format your answer strictly as:
IS_MANIFEST: YES or NO
---
[FULL TRANSCRIPTION]`;
        const aiRes = await visionAiModel.generateContent([
          { inlineData: { data: base64, mimeType } },
          checkPrompt
        ]);
        const aiText = aiRes.response.text();
        if (aiText.includes("IS_MANIFEST: YES") || aiText.toUpperCase().includes("MARIJUANA TRANSPORTATION MANIFEST") || aiText.toUpperCase().includes("METRC")) {
          isManifest = true;
          const transcript = aiText.split("---").pop()?.trim() || aiText;
          if (transcript.length > 20) {
            ocrText = transcript;
          }
        } else if (ocrText === "(No text detected)" || ocrText.length < 50) {
          const transcript = aiText.split("---").pop()?.trim() || aiText;
          if (transcript.length > 20) ocrText = transcript;
        }
      } catch (aiErr) {
        console.warn(`[process-image-async] Gemini Vision fallback failed for index ${imageIndex}:`, aiErr.message);
      }
    }

    if (isManifest) {
      console.log(`[process-image-async] Image Index ${imageIndex} detected as manifest. Caching raw file and OCR text.`);
      const sessionDir = path.join(process.cwd(), 'temp_sessions');
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }
      const ext = mimeType === 'application/pdf' ? 'pdf' : 'jpg';
      const rawFilePath = path.join(sessionDir, `${sessionId}_manifest_raw_${imageIndex}.${ext}`);
      fs.writeFileSync(rawFilePath, buffer);

      const ocrFilePath = path.join(sessionDir, `${sessionId}_manifest_ocr_${imageIndex}.json`);
      fs.writeFileSync(ocrFilePath, JSON.stringify({ ocrText, logoBrands }, null, 2), 'utf8');

      // Also clean up any accidental product json for this index if it existed
      const accidentalProd = path.join(sessionDir, `${sessionId}_product_${imageIndex}.json`);
      if (fs.existsSync(accidentalProd)) {
        try { fs.unlinkSync(accidentalProd); } catch (e) {}
      }

      // Also save raw image
      const rawImageDir = path.join(sessionDir, 'product_raw_images');
      if (!fs.existsSync(rawImageDir)) {
        fs.mkdirSync(rawImageDir, { recursive: true });
      }
      const rawImgPath = path.join(rawImageDir, `${sessionId}_product_${imageIndex}.jpg`);
      fs.promises.writeFile(rawImgPath, buffer).catch(() => {});

      return NextResponse.json({ success: true, imageIndex, isManifest: true });
    }

    // 2. Load modifiers list
    let knownModifiers = ["Hashhole", "Live Resin", "Resin", "Live Rosin", "Rosin", "Bubble Hash", "Hash Infused", "Diamond Infused", "Diamonds", "Wood Tip", "Glass Tip", "Distillate"];

    const modifiersPath = path.join(process.cwd(), 'product_modifiers.json');
    try {
      if (fs.existsSync(modifiersPath)) {
        knownModifiers = JSON.parse(fs.readFileSync(modifiersPath, 'utf8'));
      }
    } catch (e) {
      console.error("Error loading modifiers", e);
    }
    const modifiersString = knownModifiers.map(m => `"${m}"`).join(", ");

    // 3. Initialize Gemini Model
    const productModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      generationConfig: {
        temperature: 0.0,
        responseMimeType: "application/json"
      }
    });

    const generateContentWithRetry = async (model, promptArray, maxRetries = 5) => {
      let attempt = 0;
      while (attempt < maxRetries) {
        try {
          return await model.generateContent(promptArray);
        } catch (error) {
          attempt++;
          const isRateLimit = error.status === 429 || 
                              (error.message && error.message.includes('429')) || 
                              (error.toString().includes('429')) || 
                              (error.errorDetails && error.errorDetails.some(d => d['@type'] && d['@type'].includes('QuotaFailure')));
          if (isRateLimit && attempt < maxRetries) {
            let delayMs = 5000;
            if (error.errorDetails) {
              const retryInfo = error.errorDetails.find(d => d['@type'] && d['@type'].includes('RetryInfo'));
              if (retryInfo && retryInfo.retryDelay) {
                const seconds = parseInt(retryInfo.retryDelay.replace('s', ''), 10);
                if (!isNaN(seconds)) {
                  delayMs = (seconds + 1) * 1000;
                }
              }
            } else {
              delayMs = Math.pow(2, attempt) * 2000;
            }
            console.warn(`[Gemini Rate Limit 429] Attempt ${attempt} failed. Retrying in ${delayMs}ms...`);
            await new Promise(resolve => setTimeout(resolve, delayMs));
          } else {
            throw error;
          }
        }
      }
    };

    const productPrompt = `
      You are an expert Metrc Compliance Auditor processing a SINGLE photo of physical product packaging.
      Extract physical details from the packaging with 100% accuracy based ONLY on the provided image and OCR transcript.
      
      Extract the following into a JSON object:
      - **uid**: The physical package has a white Metrc sticker with a 24-character alphanumeric string (e.g. 1A40...). Do NOT attempt to extract the full 24 characters due to glare. You MUST extract ONLY the LAST 6 DIGITS of that string. The last 6 digits are usually printed in a much larger, bolder font at the very bottom right of the sticker. Your output must be exactly 6 characters.
      - **batch**: Find the batch or lot number.
      - **thc_pct**: The numeric THC percentage (e.g. 25.4). Output ONLY the number. **CRITICAL LAB TEST RESULTS RULE (SMOKABLES: FLOWER, PREROLLS, INFUSED FLOWER, VAPES, CONCENTRATES)**: Physical cannabis packaging frequently features two conflicting numbers: (1) a large, bold, rounded marketing claim printed on the front pouch or carton (e.g. "40% THC"), and (2) a state-mandated regulatory compliance sticker / certified lab testing panel (usually a white label on the back or bottom with batch codes, e.g. "THC: 40.36%" or "32.39%"). You MUST ALWAYS give strict top priority to the certified lab test results printed on the compliance sticker. If both are present, extract the exact lab-tested percentage with its decimal precision (e.g. 40.36), NEVER the rounded marketing integer.
      - **thc_mg**: The target marketed THC mg amount (e.g., 100 or 10). **CRITICAL EDIBLES RULE**: DO NOT extract exact lab test results (e.g. ignore 96, 95, 105, 101.75). Even if it is a clean integer like 96, DO NOT USE IT. Always look for the intended marketing figure printed boldly on the box (like 100mg total or 10mg per serving) and calculate the clean marketing total. Output ONLY the clean number.
      - **cbd_pct**: The numeric CBD percentage. Output ONLY the number. Always prioritize exact certified lab test results printed on the regulatory compliance sticker over front marketing claims.
      - **cbd_mg**: The target marketed CBD mg amount. DO NOT use exact lab decimals. Output ONLY the number.
      - **cbg_mg**: The target marketed CBG mg amount (if present on edibles). DO NOT use exact lab decimals. Output ONLY the number.
      - **cbn_mg**: The target marketed CBN mg amount (if present on edibles). DO NOT use exact lab decimals. Output ONLY the number.
      - **cbc_mg**: The target marketed CBC mg amount (if present on edibles). DO NOT use exact lab decimals. Output ONLY the number.
      - **thcv_mg**: The target marketed THCV mg amount (if present on edibles). DO NOT use exact lab decimals. Output ONLY the number.
      - **brand**: The exact brand name visible on the package. Cross-reference any stylized text against this Live Brands Dictionary: [${liveBrands}]. **CRITICAL:** You MUST attempt to fuzzy-match the brand you see on the bag against this exact list. If the letters are mashed together (like "DoobieLabs"), but the list has "Doobie Labs", you MUST output the exact spelling from the dictionary list! **CRITICAL ACRONYM RULE**: Check the Batch ID and Item Name for known brand acronyms: "HK" = "Honey King", "HH" = "Hashtag Honey", "DW" = "Terpwoods", "AL" = "Alter", "TTM" = "To The Moon". If the Batch ID starts with "HK-", the brand is "Honey King". If the Batch ID starts with "HH-", the brand is "Hashtag Honey". **SPECIAL RULE 1**: You are dealing with cannabis products. The logos are often highly stylized cursive, bubble-letters, or graphic-heavy. Use your visual reasoning to do your absolute best to transcribe the largest, most stylized graphic text on the bag (usually top or bottom center). **SPECIAL RULE 2**: Do NOT use the 'PROCESSED BY' or 'LICENSE NUMBER' company name as the brand, as those are often third-party co-packers. **SPECIAL RULE 3**: You may extract the brand from an email address or website URL (e.g., support@wyldcanna.com), but do NOT get confused by parent companies. Parent companies often print their support emails on sub-brands (e.g., GrA n products have Wyld support emails). If you see wyldcanna in the email but the product name is 'Pearls' or 'MEGA', the brand is GrA n, NOT Wyld. **SPECIAL RULE 4**: The brand 'Runtz' was sued and had to change the text on their packaging. However, they still use their iconic stylized script or bubble-letter logo aesthetic. If you see their iconic stylized Runtz logo or aesthetic on the bag, you MUST output 'Runtz' as the brand, even if the word itself is misspelled, missing, or says something else. **SPECIAL RULE 5**: Brand names containing numbers (e.g., '2X Baked' or '2x Baked') must be extracted as the brand (e.g., '2X Baked'). Do NOT strip the number '2X' or '2x' from the brand name, and do NOT confuse it with a '2-pack' or '2pk' count. If no logo or identifiable brand is visible, output 'Unknown'.
      - **expirationDate**: Search for the expiration date (e.g., "EXP", "Expires", "Best By"). Format as MM/DD/YY.
      - **strain**: The exact strain or flavor name. **CRITICAL**: Product lines like "Pearls" or "Mega" are NOT strains! If you see the words "Pearls" or "Mega" anywhere on the box, you MUST ignore them and look specifically for the actual fruit flavor or strain name (e.g., "Strawberry Lemonade", "Blueberry Lemonade", "Tangelo", "Nimbus Snacks"). Do not artificially append the brand name if it is not part of the strain name (e.g. if packaging says "Pluto", output "Pluto", NOT "Pluto Runtz"). However, if the authentic strain name itself explicitly includes the brand name (e.g. "Lemon Candy Runtz", "Bubblegum Runtz", "Pink Runtz", "White Runtz"), you MUST extract the full strain name as printed (e.g. "Lemon Candy Runtz"). If the product is a dual-strain infusion, you MUST combine them using " x " (e.g., "Lemon Fresh x Nimbus Snacks").
      - **strain_type**: The strain type MUST be classified strictly into one of the 5 canonical strain types: "Sativa", "Sativa Leaning Hybrid", "Hybrid", "Indica Leaning Hybrid", or "Indica" (strictly NO hyphens). **CRITICAL SATIVA/INDICA HYBRID BADGES**: If packaging features a badge, circular stamp, or text stating "Sativa Hybrid", "Sativa-Leaning Hybrid", "Sativa Leaning", or similar, you MUST extract it as "Sativa Leaning Hybrid". If packaging states "Indica Hybrid", "Indica-Leaning Hybrid", "Indica Leaning", or similar, you MUST extract it as "Indica Leaning Hybrid". NEVER collapse "Sativa Hybrid" or "Indica Hybrid" to generic "Hybrid"! **DUAL-STRAIN / DUAL-CHAMBER LOGIC:** For dual-chamber vapes (e.g. Cookies 2g Dual Chamber): If the primary/first chamber is marked "Sativa Hybrid" (e.g. Apples & Bananas x Huckleberry Gelato, or LPC 75 x Black Cherry Gelato), you MUST extract it as "Sativa Leaning Hybrid". If both chambers are marked Indica Hybrid (e.g. Gary Payton x Pomegranate Shake), extract as "Indica Leaning Hybrid". NEVER collapse a dual-chamber device with a Sativa Hybrid badge to generic 50/50 "Hybrid"! If no strain type is printed, output null.
        - **category**: The EXACT FULL category path from this dictionary: [${allowedCategories}]. You MUST output the entire string including the '>' symbols. Do not truncate or modify the category name. STRICT EDIBLES RULE: If the product is a gummy, ring, belt, or chew, you MUST classify it as "Edibles > Gummies", NEVER "Candy". TINCTURE RULE: If the product is a liquid, sublingual drops, spray, or dropper bottle (usually indicated by volume like "1 FL OZ", "1FL OZ", "30ml", or "Tincture"), you MUST classify it as "Edibles > Tinctures", even if the product name contains the word "drops" (e.g., "Pillow Talk Drops" liquid is a Tincture, NOT a Gummy). BEVERAGE RULE: If the product is a beverage, drink, soda, seltzer, or beverage enhancer (usually indicated by liquid volumes like "12oz", "12 FL OZ", "8oz", or "1.5oz"), you MUST classify it as "Edibles > Beverages". CONCENTRATE RULE: If the product is a concentrate, extract, dabs, hash, badder, live resin jar, live rosin jar, wax, shatter, or budder (usually indicated by words like "Jar", "Extract", "Concentrate", "Badder", "Budder", "Hash", "Rosin", "Resin", or a small jar container/packaging), you MUST classify it under the "Concentrates" tree (e.g., "Concentrates > Live Resin" or "Concentrates > Rosin"). Under no circumstances should you classify a concentrate jar as "Flower" or "Vapes". CRITICAL RULE: NEVER output the word 'Bud' or 'Buds'. If the product is raw cannabis bud, you MUST output 'Flower'. METRC CATEGORY RULE: Manifests often print generic State/Metrc compliance categories like "(Vape Cartridge - Each)" right underneath the Item Name. Do NOT blindly trust this for your Alleaves category! Metrc groups all AIOs, Disposables, and Pods under the generic "Vape Cartridge" umbrella. You must look closely at the actual Item Name text AND the physical packaging photo to determine if it is an AIO or Disposable before defaulting to "Vapes > Carts". If the packaging or item name says "Disposable", "All-in-One", "AIO", or "Pen", OR if the visual photo clearly shows a disposable device with a built-in battery rather than a simple 510 thread screw-on cartridge (e.g., Terpwoods devices), you MUST map it to "Vapes > All-in-One Vapes" completely ignoring the generic Metrc label. VAPE EXTRACT RULE: If the product is a Vape and you see "HTE", "High Terpene Extract", or "Live Resin" printed on the label/manifest, you MUST classify it as "Live Resin" (e.g. "Vapes > Carts > Live Resin" or "Vapes > All-in-One Vapes > Live Resin"). If you see "Rosin" or "Live Rosin", you MUST classify it as "Rosin" (e.g. "Vapes > Carts > Rosin" or "Vapes > All-in-One Vapes > Rosin"). If no extract type is explicitly printed, you MUST safely default to the "> Distillate" branch (e.g. "Vapes > All-in-One Vapes > Distillate"). Do not leave the category hanging at the hardware type.
      - **product_format**: Scan the product packaging image or printed strain name for premium formats/modifiers. Known modifiers dictionary: [${modifiersString}]. You may stack multiple modifiers logically. If none are found, output an empty string "". Make sure to remove this format text from the "strain" field to keep the strain name clean. IMPORTANT: NEVER extract "Cannabis" or "Cannabis Infused" as a modifier. CRITICAL RULE: If you see "HTE", "High Terpene Extract", "Live Resin", or "Live Rosin", you MUST extract it as a modifier. **CLEANING RULE**: Do NOT output symbols like hyphens. Output clean, singular words (e.g., "Preroll"). **CRITICAL ROSIN/CURE RULE**: Do NOT output "Cold Cure" or "Cold Cured" in product_format unless the physical label explicitly has the words "Cold Cure" or "Cold Cured" printed on it. If it only says "Rosin" or "Live Rosin", output "Rosin" or "Live Rosin" without any "Cold Cure" prefix.
      - **chemical_ratio**: (NON-SMOKABLES ONLY) If the product is an edible, tincture, or topical, look for an explicit, marketed chemical ratio printed on the box (e.g., '1:1:1 THC:CBD:CBN'). If a ratio is not explicitly printed, but proportional cannabinoid mg totals are prominently printed on the front packaging (e.g., '50mg THC & 50mg CBD per package' or '100mg THC / 100mg CBD total'), you should safely deduce the chemical ratio from these totals (e.g., equal totals imply a '1:1' ratio). If no ratio is printed or can be deduced, output null. **EDIBLE MULTIPACK RULE**: If the edible is a multipack (count > 1), you MUST extract the pack configuration here in the ratio field! Use the format 'Xpk' or 'Xea' (e.g., '10pk' or '2ea') and append it to any existing ratio with a pipe, e.g., '1:1 | 10pk'. If there is no ratio, just output '10pk'. Do NOT extract pack configurations for smokables (prerolls, flower, vapes) into this field.
      - **weight**: **CRITICAL NON-SMOKABLE RULE**: If the product is an edible, tincture, or topical (e.g., gummies, lotions, balms), you are STRICTLY FORBIDDEN from extracting the physical mass (e.g., 56g, 2oz, 30ml) as the weight. You MUST extract the prominently marketed active THC or CBD milligram dosage instead (e.g., '100mg' or '1000mg'). **CRITICAL**: IGNORE exact lab test results printed on stickers! If a sticker says 96mg, 95mg, or 105mg, do NOT output those numbers! You MUST output the intended clean marketing integer (e.g., "1000mg").
      - For smokables (Flower, Vapes, Prerolls, Extracts), use simple physical mass (e.g., '3.5g', '1g'). **CRITICAL:** Do NOT confuse the THC mg with the physical weight! For example, if the manifest says "THC: 900 mg | Wgt: 1 g", the correct physical product weight is "1g". You MUST extract the value explicitly labeled "Wgt:" or "Weight", NEVER the THC value!
      - **CRITICAL TOTAL NET WEIGHT RULE**: For smokables, you MUST extract the TOTAL NET WEIGHT of the package. If the packaging lists a breakdown of weights (e.g., '0.9g Flower, 0.6g Rosin, 1.5g Net Weight' or '1.5g Total (0.9g flower + 0.6g rosin)'), you MUST extract the TOTAL NET WEIGHT (e.g., '1.5g'), NOT the individual breakdown weights (like '0.6g' or '0.9g').
      - **SLASHED-ZERO OCR RULE**: Google Cloud Vision OCR struggles to differentiate slashed zeros (e.g. '0' with a diagonal slash) from the number '8'. Consequently, printed weights of '1.00g' on physical labels are frequently transcribed in OCR as '1.88g' or '1.80g' or '1.08g'. If the OCR transcript says '1.80g' or '1.88g' or '1.08g' (or similar) for a vape cartridge, all-in-one vape, or extract, and the packaging clearly is a standard 1g size, you MUST correct it and extract '1g'. Similarly, correct '0.88g'/'0.80g'/'0.58g' to '0.5g' and '2.88g'/'2.80g'/'2.08g' to '2g'.
      - Preroll/Flower/Vape Multipacks: You MUST extract the pack configuration here in the weight field! Use the format 'Xpk | Y' (e.g., '14pk | 7g' or '5pk | 2.5g'). Do NOT put flower/vape multipacks into the chemical_ratio field! **CRITICAL BRANDING NUMBERS RULE**: Do NOT confuse brand names or product line names/marketing slogans containing numbers (such as '2X Baked', '2x Baked', 'STIIIZY 40's', or 'STIIIZY 40s') with pack configurations. A '2X Baked' item is NOT a '2pk'. If the item is a single pre-roll, it is NOT a multipack; do NOT add a pack size prefix. Look for actual pack counts like '5-pack', '5pk', '5 pre-rolls' printed elsewhere on the box, rather than blindly parsing brand or product line numbers. If no pack count is explicitly printed, default to 1 (no prefix). **CRITICAL CASE-PACK (CPK) RULE**: Do NOT confuse distributor case pack abbreviations (like '16cpk', '8cpk', '12cpk') with consumer multipack counts. A '16cpk' or '8cpk' indicates a wholesale case pack shipment, but the retail product itself is sold individually as a single unit (e.g., a single 0.5g preroll or single 28g flower smalls bag). Under no circumstances should you extract a case pack number as a pack size prefix. Always treat the product as a single pack (no prefix) unless the packaging itself clearly shows a consumer multipack (like a 5-pack preroll tin).
      
      **GLOBAL MANIFEST PACK-SIZE RULE**: Under NO CIRCUMSTANCES are you permitted to extract a pack size (e.g. '48pk', '10pk') by reading the 'Quantity', 'Shipped', or 'Received' column of a paper manifest. You are STRICTLY FORBIDDEN from using shipment quantities to build pack sizes for ANY field! When reading a paper manifest, you MUST ONLY look for pack configurations natively inside the explicit 'Item Name' or 'Description' text field. When reading a physical product box image, you may look anywhere on the box.

      If a value cannot be found, return null for it.
      Return ONLY a raw JSON object. Do not include markdown code block syntax.
    `;

    const result = await generateContentWithRetry(productModel, [
      productPrompt,
      `\n\nOCR Transcript for this product:\n${ocrText}`,
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    const resText = result.response.text();
    let cleanJsonText = cleanJSON(resText);
    const parsedData = JSON.parse(cleanJsonText);

    // Save this item to a collision-proof session file
    const sessionDir = path.join(process.cwd(), 'temp_sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const sessionFilePath = path.join(sessionDir, `${sessionId}_product_${imageIndex}.json`);
    fs.writeFileSync(sessionFilePath, JSON.stringify(parsedData, null, 2), 'utf8');

    // Save raw product image non-blockingly for archival, dataset training, and offline testing
    const rawImageDir = path.join(sessionDir, 'product_raw_images');
    if (!fs.existsSync(rawImageDir)) {
      fs.mkdirSync(rawImageDir, { recursive: true });
    }
    const rawImgPath = path.join(rawImageDir, `${sessionId}_product_${imageIndex}.jpg`);
    fs.promises.writeFile(rawImgPath, buffer).catch(err => console.error("Error saving raw product image:", err));

    return NextResponse.json({ success: true, imageIndex, isManifest: false });
  } catch (error) {
    console.error("Async Process Image Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
