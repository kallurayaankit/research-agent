"""Run against a disposable B-Ram server, never against a personal library.

BRAM_TEST_URL=http://127.0.0.1:8000 python tests/browser_smoke.py
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base_url = os.getenv("BRAM_TEST_URL", "http://127.0.0.1:8000")
artifacts = Path(os.getenv("BRAM_ARTIFACTS", "/tmp/bram-artifacts"))
artifacts.mkdir(parents=True, exist_ok=True)

with sync_playwright() as playwright:
    browser = playwright.chromium.launch(executable_path=os.getenv("CHROMIUM_PATH", "/usr/bin/chromium"), args=["--no-sandbox"])
    page = browser.new_page(viewport={"width": 1440, "height": 1050}, device_scale_factor=1)
    errors = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base_url)
    expect(page.get_by_role("heading", name="Your ideas, in good company.")).to_be_visible()
    expect(page.locator("#sample-notes")).to_be_visible()
    page.locator("#sample-notes").click()
    expect(page.locator(".document-card")).to_have_count(4)
    page.screenshot(path=str(artifacts / "bram-library-desktop.png"), full_page=True)
    page.locator("#capture").click()
    page.get_by_role("textbox", name="Title", exact=True).fill("Browser test <script>alert(1)</script>")
    page.locator("#doc-content").fill("A zebracorn is a memorable test keyword.")
    page.locator("#doc-tags").fill("testing, personal")
    page.locator("#save-doc").click()
    expect(page.locator("#editor")).not_to_be_visible()
    page.locator("#search").fill("zebracorn")
    expect(page.locator(".document-card")).to_have_count(1)
    expect(page.locator(".document-card h2")).to_have_text("Browser test <script>alert(1)</script>")
    page.locator(".document-card").click()
    page.locator("#doc-title").fill("A test worth remembering")
    page.locator("#save-doc").click()
    expect(page.locator(".document-card h2")).to_have_text("A test worth remembering")
    page.locator('[data-view="review"]').click()
    expect(page.locator(".review-card")).to_have_count(5)
    page.get_by_role("button", name="I remember this").first.click()
    expect(page.locator(".review-card")).to_have_count(4)
    page.locator('[data-view="chat"]').click()
    page.locator("#question").fill("zebracorn")
    page.locator("#ask-button").click()
    expect(page.locator(".chat-message.assistant")).to_contain_text("Ollama is unavailable", timeout=15000)
    page.locator("#chat-settings").click()
    expect(page.locator("#model-status")).to_contain_text("offline", timeout=10000)
    with page.expect_download() as download:
        page.get_by_role("link", name="Export library").click()
    backup_path = artifacts / "bram-browser-backup.json"
    download.value.save_as(backup_path)
    page.locator("#restore-input").set_input_files(backup_path)
    expect(page.locator("#toast")).to_contain_text("5 existing items kept")
    page.locator('[data-view="library"]').click()
    page.locator("#search").fill("")
    expect(page.locator(".document-card")).to_have_count(5)
    page.set_viewport_size({"width": 390, "height": 844})
    page.screenshot(path=str(artifacts / "bram-library-mobile.png"), full_page=True)
    assert page.evaluate("document.documentElement.scrollWidth <= window.innerWidth"), "Mobile page overflows horizontally"
    page.locator("#capture").click()
    expect(page.locator("#editor")).to_be_visible()
    page.locator("#editor .close-dialog").first.click()
    assert not errors, errors
    browser.close()
    print("Browser smoke passed: create/edit/search, safe text rendering, review, offline chat, backup/restore, responsive layout.")
