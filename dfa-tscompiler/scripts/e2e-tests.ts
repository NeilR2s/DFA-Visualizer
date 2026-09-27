import assert from "node:assert/strict"
import { chromium } from "playwright"
import { preview } from "vite"

async function runE2ETests() {
  console.log("Starting preview server...")
  const server = await preview({
    preview: {
      port: 4174,
    },
  })

  const baseUrl = server.resolvedUrls?.local?.[0] ?? "http://localhost:4174"
  console.log(`Preview server ready at ${baseUrl}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    console.log("Running Responsive Viewport & Geometry checks...")
    const viewports = [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Small Desktop", width: 1024, height: 768 },
      { name: "Standard Desktop", width: 1280, height: 800 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto(baseUrl, { waitUntil: "networkidle" })

      // Check for horizontal overflow
      const overflow = await page.evaluate(() => {
        return {
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          bodyClientWidth: document.body.clientWidth,
        }
      })

      assert.ok(
        overflow.docScrollWidth <= overflow.docClientWidth + 1,
        `${vp.name} (${vp.width}x${vp.height}): Document has horizontal overflow: scrollWidth=${overflow.docScrollWidth}, clientWidth=${overflow.docClientWidth}`
      )

      // Check that heading and description do not overlap
      const h1Box = await page.locator("h1").boundingBox()
      const descBox = await page.locator("header p").first().boundingBox()

      assert.ok(h1Box, `${vp.name}: h1 bounding box should exist`)
      assert.ok(
        descBox,
        `${vp.name}: header description bounding box should exist`
      )

      const isColliding = !(
        h1Box.x + h1Box.width <= descBox.x ||
        h1Box.y + h1Box.height <= descBox.y ||
        descBox.x + descBox.width <= h1Box.x ||
        descBox.y + descBox.height <= h1Box.y
      )

      assert.ok(
        !isColliding,
        `${vp.name} (${vp.width}x${vp.height}): Heading overlaps description copy`
      )
    }
    console.log("✓ Responsive viewport and non-collision checks passed.")

    // Return to standard desktop for interaction testing
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(baseUrl, { waitUntil: "networkidle" })

    console.log("Running Mode Switching DOM Integration checks...")
    // Switch to CFG mode
    await page.locator('button:has-text("CFG")').click()
    assert.equal(
      await page.locator('span:has-text("Grammar")').isVisible(),
      true,
      "Grammar card should be visible in CFG mode"
    )
    assert.equal(
      await page
        .locator('span:has-text("Current Sentential Form")')
        .isVisible(),
      true,
      "Sentential Form card should be visible in CFG mode"
    )

    // Switch to PDA mode
    await page.locator('button:has-text("PDA")').click()
    assert.equal(
      await page.locator('span:has-text("Stack")').first().isVisible(),
      true,
      "Stack panel should be visible in PDA mode"
    )
    assert.equal(
      await page.locator('svg[aria-label*="PDA"]').isVisible(),
      true,
      "PDA SVG graph should be visible in PDA mode"
    )

    // Switch back to DFA mode
    await page.locator('button:has-text("DFA")').click()
    assert.equal(
      await page.locator('svg[aria-label*="DFA"]').isVisible(),
      true,
      "DFA SVG graph should be visible in DFA mode"
    )
    console.log("✓ Mode switching DOM checks passed.")

    console.log("Running Simulation & Trace Auto-Scroll checks...")
    // Simulate accepted string
    await page.locator('button:has-text("Simulate")').click()

    // Trace tab should become active
    await page.waitForSelector(
      'button[role="tab"]:has-text("Trace")[data-state="active"]'
    )

    // Wait briefly for step playback or pause and step forward
    await page.waitForTimeout(1000)

    // Pause simulation if still playing
    const playPauseBtn = page.locator('button:has-text("Pause")')
    if (await playPauseBtn.isVisible()) {
      await playPauseBtn.click()
    }

    // Step to the end using Next button
    const nextBtn = page.locator('button:has-text("Next")')
    while (await nextBtn.isEnabled()) {
      await nextBtn.click()
      await page.waitForTimeout(100)
    }

    // Status pill should read ACCEPTED
    const statusPill = page.locator('section span:has-text("Accepted")')
    assert.equal(
      await statusPill.isVisible(),
      true,
      "Status pill should display Accepted"
    )

    await page.waitForTimeout(600)

    // Verify active trace item is scrolled into view in trace container
    const traceScrollInfo = await page.evaluate(() => {
      const activeItem = document.querySelector('[data-step-active="true"]')
      if (!activeItem) return { error: "No activeItem found" }
      const container = activeItem.closest(".overflow-y-auto")
      if (!container) return { error: "No container found" }

      const cRect = container.getBoundingClientRect()
      const aRect = activeItem.getBoundingClientRect()
      return {
        cTop: cRect.top,
        cBottom: cRect.bottom,
        aTop: aRect.top,
        aBottom: aRect.bottom,
        isScrolledIn:
          aRect.top >= cRect.top - 12 && aRect.bottom <= cRect.bottom + 12,
      }
    })

    console.log("Trace scroll check info:", traceScrollInfo)
    assert.ok(
      traceScrollInfo.isScrolledIn,
      "Final active step must be scrolled into view within the trace scroll container"
    )
    console.log("✓ Trace auto-scroll checks passed.")

    console.log("Running Preset Switching checks...")
    // Switch to Control tab
    await page.locator('button[role="tab"]:has-text("Control")').click()

    // Open Select dropdown
    await page.locator("#preset-select").click()
    await page.locator('[role="option"]:has-text("STARS")').click()

    // Check updated machine details
    const alphabetText = await page.locator("text=Alphabet: 0, 1").isVisible()
    const statesText = await page.locator("text=States: 24").isVisible()
    assert.ok(alphabetText, "Alphabet should update to 0, 1 for STARS preset")
    assert.ok(statesText, "States should update to 24 for STARS preset")
    console.log("✓ Preset switching checks passed.")

    console.log("\nAll End-to-End tests passed successfully!")
  } finally {
    await browser.close()
    await server.close()
  }
}

runE2ETests().catch((error) => {
  console.error("E2E Test Failed:", error)
  process.exit(1)
})
