const fs = require('fs');
const path = require('path');

// Read input: either from a file argument or from stdin
let input = '';
if (process.argv[2]) {
    input = fs.readFileSync(process.argv[2], 'utf8');
} else {
    input = fs.readFileSync(0, 'utf8'); // stdin
}

// Split by the marker "// FILE: "
const blocks = input.split(/\/\/ FILE: /).filter(b => b.trim() !== '');

blocks.forEach(block => {
    const lines = block.split('\n');
    const filePath = lines[0].trim();
    if (!filePath) return;

    const content = lines.slice(1).join('\n');

    // Determine target: .ts files go to backend, all others to frontend
    const targetDir = filePath.endsWith('.js') ? 'backend' : 'frontend';
    const fullPath = path.join(targetDir, filePath);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // If file already exists, rename it to <filename>-old.<ext>
    if (fs.existsSync(fullPath)) {
        const parsed = path.parse(fullPath);
        const oldPath = path.join(parsed.dir, parsed.name + '-old' + parsed.ext);
        fs.renameSync(fullPath, oldPath);
        console.log(`📦 Moved existing file to ${oldPath}`);
    }

    // Write new file
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Written: ${fullPath}`);
});

console.log('\n🎉 All files written successfully.');