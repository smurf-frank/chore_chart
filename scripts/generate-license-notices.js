const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'licenses-third-party';
const SRC_DIR = 'src/licenses-third-party';

console.log('⚖️ Generating modular third-party license notices...');

try {
    // 1. Get JSON output from license-checker
    const jsonOutput = execSync('npx license-checker-rseidelsohn --production --json', {
        encoding: 'utf8'
    });
    const json = JSON.parse(jsonOutput);

    // 2. Prepare output directory
    if (fs.existsSync(OUTPUT_DIR)) {
        fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
    }
    fs.mkdirSync(OUTPUT_DIR);

    // 3. Process each dependency
    for (const [pkg, info] of Object.entries(json)) {
        // Skip the project itself if it shows up
        if (pkg.startsWith('chore-chart@')) continue;

        // Create a safe filename (e.g., @capacitor/core@6.2.1 -> capacitor-core.txt)
        const safeName = pkg.replace(/^@/, '').replace(/\//g, '-').split('@')[0];
        const filename = `${safeName}.txt`;
        const filePath = path.join(OUTPUT_DIR, filename);

        let content = `Package: ${pkg}\n`;
        content += `License: ${info.licenses}\n`;
        if (info.repository) content += `Repository: ${info.repository}\n`;
        if (info.publisher) content += `Publisher: ${info.publisher}\n`;
        content += `\n--------------------------------------------------------------------------------\n\n`;

        if (info.licenseFile && fs.existsSync(info.licenseFile)) {
            content += fs.readFileSync(info.licenseFile, 'utf8');
        } else {
            content += `[Notice: Full license text not found in package. License type: ${info.licenses}]\n`;
        }

        fs.writeFileSync(filePath, content);
    }

    console.log(
        `✅ Successfully generated ${Object.keys(json).length - 1} individual license files in ${OUTPUT_DIR}/`
    );

    // 4. Sync to src/ for app consumption
    if (fs.existsSync('src')) {
        if (fs.existsSync(SRC_DIR)) {
            fs.rmSync(SRC_DIR, { recursive: true, force: true });
        }
        fs.mkdirSync(SRC_DIR, { recursive: true });

        // Simple recursive copy
        const files = fs.readdirSync(OUTPUT_DIR);
        for (const file of files) {
            fs.copyFileSync(path.join(OUTPUT_DIR, file), path.join(SRC_DIR, file));
        }
        console.log(`📂 Synchronized to ${SRC_DIR}/ for app distribution.`);
    }
} catch (error) {
    console.error('❌ Failed to generate license notices:', error.message);
    process.exit(1);
}
