
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/assets/animations/scalable-support.json');

function traverseAndCollect(obj, colors) {
    if (Array.isArray(obj)) {
        obj.forEach(item => traverseAndCollect(item, colors));
    } else if (typeof obj === 'object' && obj !== null) {
        if (obj.hasOwnProperty('k') && Array.isArray(obj.k) && typeof obj.k[0] === 'number') {
            if (obj.k.length >= 3 && obj.k[0] <= 1 && obj.k[1] <= 1 && obj.k[2] <= 1) {
                // Found a color-like array
                const colorStr = JSON.stringify(obj.k.slice(0, 3)); // Store R, G, B
                if (!colors.has(colorStr)) {
                    colors.add(colorStr);
                }
            }
        }

        for (let key in obj) {
            traverseAndCollect(obj[key], colors);
        }
    }
}

try {
    const data = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(data);

    const colors = new Set();
    traverseAndCollect(json, colors);

    console.log("Found colors:");
    colors.forEach(c => {
        const [r, g, b] = JSON.parse(c);
        const r255 = Math.round(r * 255);
        const g255 = Math.round(g * 255);
        const b255 = Math.round(b * 255);
        console.log(`RGB: [${r}, ${g}, ${b}] -> rgb(${r255}, ${g255}, ${b255})`);
    });

} catch (e) {
    console.error('Error running script:', e);
}
