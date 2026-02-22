# Playwright Sharding Strategy (Future Optimization)

As the test suite for **Chore Chart** grows, the execution time bound by a single machine may become a bottleneck, even with `fullyParallel: true`. To scale our testing horizontally across multiple machines, we can implement **Playwright Sharding** using GitHub Actions' Matrix Strategy.

## Overview
Sharding splits the test suite into multiple smaller logical "shards." Instead of one GitHub runner executing all tests, multiple runners launch simultaneously, each executing a fraction of the test suite.

## Implementation Details

### 1. Matrix Strategy in GitHub Actions
We modify the `ci.yml` workflow to spawn multiple concurrent jobs.

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3]
        shardTotal: [3]
```

### 2. Passing Shard Execution to Playwright
Within each matrix job, we pass the `--shard` flag. Playwright natively calculates which `.spec.js` files belong to the current shard.

```yaml
      - name: Run Playwright tests
        run: npx playwright test --shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
```

### 3. Uploading Partial Blobs
Because each runner executes only a subset of the tests, the generated report is incomplete. Playwright allows us to export a "blob" containing the raw test results.

```yaml
      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
```

### 4. Merging the Reports
Once all shards finish, a dependent job runs to download all the blobs and merge them into a single, comprehensive HTML report.

```yaml
  merge-reports:
    if: always()
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install dependencies
        run: npm ci
      - name: Download blobs
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - name: Merge into HTML Report
        run: npx playwright merge-reports --reporter html ./all-blob-reports
      - name: Upload HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## When to Switch?
- When the total test execution time on CI consistently exceeds **3-5 minutes**.
- When the number of domain modules expands significantly beyond the current count.
- When running cross-browser tests (e.g., adding Firefox and WebKit testing alongside Chromium).
