const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'licenses-third-party';
const SRC_DIR = 'src/licenses-third-party';

console.log('⚖️ Generating modular third-party license notices...');

try {
    // 1. Get JSON output from license-checker
    // We use all dependencies but filtered later to ensure we don't miss things like @capacitor/android
    // which are technically in "dependencies" but sometimes skipped by --production
    const jsonOutput = execSync('npx license-checker-rseidelsohn --json', {
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
        // Skip the project itself
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

    // 4. Add Manually Tracked Assets (Fonts, Vendor-bundled JS)
    const MANUAL_ASSETS = [
        {
            name: 'sql-js',
            pkg: 'sql.js',
            license: 'MIT',
            repository: 'https://github.com/sql-js/sql.js',
            publisher: 'sql-js team',
            text: 'MIT License\n\nCopyright (c) 2012 Alon Zakai\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.'
        },
        {
            name: 'mobile-drag-drop',
            pkg: 'mobile-drag-drop',
            license: 'MIT',
            repository: 'https://github.com/timruffles/mobile-drag-drop',
            publisher: 'Tim Ruffles',
            text: 'MIT License\n\nCopyright (c) 2013 Tim Ruffles\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in\nall copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN\nTHE SOFTWARE.'
        },
        {
            name: 'inter-font',
            pkg: 'Inter Font',
            license: 'OFL-1.1',
            repository: 'https://github.com/rsms/inter',
            publisher: 'Rasmus Andersson',
            text: 'SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n\nPREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide development of shared font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.\n\nThe OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.'
        },
        {
            name: 'outfit-font',
            pkg: 'Outfit Font',
            license: 'OFL-1.1',
            repository: 'https://github.com/Outfit-Font-Family/Outfit',
            publisher: 'Rodrigo Fuenzalida',
            text: 'SIL OPEN FONT LICENSE Version 1.1 - 26 February 2007\n\nPREAMBLE\nThe goals of the Open Font License (OFL) are to stimulate worldwide development of shared font projects, to support the font creation efforts of academic and linguistic communities, and to provide a free and open framework in which fonts may be shared and improved in partnership with others.\n\nThe OFL allows the licensed fonts to be used, studied, modified and redistributed freely as long as they are not sold by themselves. The fonts, including any derivative works, can be bundled, embedded, redistributed and/or sold with any software provided that any reserved names are not used by derivative works. The fonts and derivatives, however, cannot be released under any other type of license. The requirement for fonts to remain under this license does not apply to any document created using the fonts or their derivatives.'
        }
    ];

    for (const asset of MANUAL_ASSETS) {
        const filePath = path.join(OUTPUT_DIR, `${asset.name}.txt`);
        let content = `Package: ${asset.pkg}\n`;
        content += `License: ${asset.license}\n`;
        content += `Repository: ${asset.repository}\n`;
        content += `Publisher: ${asset.publisher}\n`;
        content += `\n--------------------------------------------------------------------------------\n\n`;
        content += asset.text;
        fs.writeFileSync(filePath, content);
    }

    console.log(
        `✅ Successfully generated ${Object.keys(json).length - 1 + MANUAL_ASSETS.length} individual license files in ${OUTPUT_DIR}/`
    );

    // 5. Sync to src/ for app consumption
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
