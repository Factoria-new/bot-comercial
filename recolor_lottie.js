
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/assets/animations/scalable-support.json');
const outputPath = filePath; // Overwrite

function rgbToHsl(r, g, b) {
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min) {
        h = s = 0; // achromatic
    } else {
        let d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h, s, l];
}

function hslToRgb(h, s, l) {
    let r, g, b;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return [r, g, b];
}

function traverseAndRecolor(obj) {
    if (Array.isArray(obj)) {
        // specific check for color array [r,g,b,a] usually in 'k'
        // But in Lottie, 'c' prop usually has 'k' which is the color array.
        // We need to look for objects with 'c' property (color) or just arrays that look like colors?
        // Lottie structure: property 'c' -> { k: [r,g,b,a] }

        // Actually traversal is safer on keys.
        obj.forEach(item => traverseAndRecolor(item));
    } else if (typeof obj === 'object' && obj !== null) {
        // Check if this object is a color property
        // It helps to look for "c" key in shapes, but here we might just find the arrays [r,g,b,a] in "k"

        // If "k" is an array of numbers and length >= 3
        if (obj.hasOwnProperty('k') && Array.isArray(obj.k) && typeof obj.k[0] === 'number') {
            // Check if it's likely a color
            // Color values are usually 0-1. If any is > 1, it might be position.
            // Also alpha is usually 4th element.
            if (obj.k.length >= 3 && obj.k[0] <= 1 && obj.k[1] <= 1 && obj.k[2] <= 1) {
                recolor(obj.k);
            }
        }

        // Recolor nested
        for (let key in obj) {
            traverseAndRecolor(obj[key]);
        }
    }
}

function recolor(colorArray) {
    const r = colorArray[0];
    const g = colorArray[1];
    const b = colorArray[2];

    // Check if purple-ish
    // Purple has high Red and Blue, low Green.
    // e.g. [0.5, 0.08, 0.8]

    if (r > 0.2 && b > 0.2 && g < 0.5 && b > g) {
        // It is likely purple.
        // Convert to HSL
        let [h, s, l] = rgbToHsl(r, g, b);

        // Shift Hue. 
        // Purple is around 0.75 (270deg). Green is around 0.33 (120deg).
        // Target: Brand Green #00A947 = [0, 0.66, 0.28] -> H: 0.38, S: 1, L: 0.33

        // Let's force the Hue to be around 0.38 (137deg)
        h = 0.38;

        // Adjust Saturation/Lightness to match brand feel? 
        // Or just shift hue. Let's try shifting hue first, maybe boost saturation if it was dull.
        // The brand green is quite saturated.
        if (s < 0.8) s = Math.min(1, s * 1.2);

        const [newR, newG, newB] = hslToRgb(h, s, l);
        colorArray[0] = newR;
        colorArray[1] = newG;
        colorArray[2] = newB;
    }

    // Also handle the light pink/purple background elements?
    // [0.92, 0.87, 0.95] -> Light Greenish or Neutral?
    if (r > 0.8 && b > 0.8 && g > 0.8 && r < 0.95 && b > r) {
        // Light purple tint. Shift to light green tint.
        let [h, s, l] = rgbToHsl(r, g, b);
        h = 0.38; // Green hue
        s = s * 0.8; // Reduce saturation a bit for background
        const [newR, newG, newB] = hslToRgb(h, s, l);
        colorArray[0] = newR;
        colorArray[1] = newG;
        colorArray[2] = newB;
    }
}

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    traverseAndRecolor(json);

    fs.writeFileSync(outputPath, JSON.stringify(json));
    console.log('Recolor script finished successfully.');
} catch (e) {
    console.error('Error running script:', e);
    process.exit(1);
}
