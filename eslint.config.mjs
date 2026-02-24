import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    { ignores: ['src/vendor/**', 'wdio.conf.js'] },
    js.configs.recommended,
    eslintConfigPrettier,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                // DOM / Browser APIs
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                navigator: 'readonly',
                localStorage: 'readonly',
                self: 'readonly',
                caches: 'readonly',
                crypto: 'readonly',
                atob: 'readonly',
                btoa: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                alert: 'readonly',
                prompt: 'readonly',
                confirm: 'readonly',
                fetch: 'readonly',
                Uint8Array: 'readonly',
                String: 'readonly',
                Math: 'readonly',
                parseInt: 'readonly',
                JSON: 'readonly',
                Date: 'readonly',
                module: 'readonly',
                require: 'readonly',
                process: 'readonly',
                __dirname: 'readonly',
                fs: 'readonly',

                // Third-party / Global libs
                initSqlJs: 'readonly',

                // Chore Chart Project Globals (Across src files)
                _db: 'writable',
                DB_NAME: 'readonly',
                StorageStrategy: 'readonly',
                ChoreRepository: 'readonly',
                renderBoard: 'readonly',
                renderPalette: 'readonly',
                renderHeader: 'readonly',
                initDatabase: 'readonly',
                createSchema: 'readonly',
                getOrderedDays: 'readonly',
                createCellMarker: 'readonly',
                openRotationModal: 'readonly',
                openSettings: 'readonly',
                closeSettings: 'readonly',
                saveSettings: 'readonly',
                renderPeopleList: 'readonly',
                renderGroupsList: 'readonly',
                bindEvents: 'readonly',
                init: 'readonly',
                ALL_DAYS: 'readonly',
                sortDirection: 'writable',
                tryVibrate: 'readonly',

                // Test Runner Framework Globals
                describe: 'readonly',
                it: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                expect: 'readonly',
                describeQueue: 'writable',
                currentDescribe: 'writable',
                runTests: 'readonly',
                runDescribe: 'readonly',
                dbExecute: 'readonly',
                dbQuery: 'readonly',
                migrateToActors: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-undef': 'error'
        }
    },
    // WebdriverIO E2E test overrides — these globals are injected by the WDIO runner
    {
        files: ['tests/e2e/**/*.js'],
        languageOptions: {
            globals: {
                driver: 'readonly',
                $: 'readonly',
                $$: 'readonly',
                before: 'readonly',
                after: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly'
            }
        }
    }
];
