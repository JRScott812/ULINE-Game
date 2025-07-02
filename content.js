(function () {
    let firstPrice = null;
    let redactedElements = [];

    // Hide body immediately
    const style = document.createElement('style');
    style.textContent = 'body { visibility: hidden !important; }';
    document.documentElement.appendChild(style);

    function redactDollarElements() {
        // Only target price cells in the product chart
        const priceCells = document.querySelectorAll('td.PriceCellChartcopyItemW10H18');
        redactedElements = [];
        firstPrice = null;

        priceCells.forEach(cell => {
            // Find the first $ price in the cell (usually in an <attrib> tag)
            const match = cell.textContent.match(/\$\s*([\d,]+)/);
            console.log("[ULINE Game] Checking cell:", cell, "Text:", cell.textContent, "Match:", match);
            if (firstPrice === null && match) {
                firstPrice = parseInt(match[1].replace(/,/g, ''), 10);
                console.log("[ULINE Game] First price found and saved:", firstPrice);
            }
            // Save original text for reveal
            cell.dataset.originalText = cell.textContent;
            cell.textContent = "???";
            cell.style.background = "";
            redactedElements.push(cell);
        });

        if (firstPrice !== null) {
            chrome.runtime.sendMessage({ action: "setPrice", price: firstPrice });
            console.log("[ULINE Game] Sent price to popup:", firstPrice);
        } else {
            console.log("[ULINE Game] No valid price found to save.");
        }
    }

    function revealDollarElements() {
        redactedElements.forEach(cell => {
            cell.textContent = cell.dataset.originalText;
            cell.style.background = "yellow";
            console.log("[ULINE Game] Revealed element:", cell);
        });
    }

    // Redact on load
    redactDollarElements();

    // After redacting, show body
    function showBody() {
        style.remove();
        document.body.style.visibility = 'visible';
        console.log("[ULINE Game] Body revealed after redaction.");
    }

    showBody();

    // Listen for reveal message
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
        if (msg.action === "revealPrice") {
            console.log("[ULINE Game] Received revealPrice message.");
            revealDollarElements();
        }
    });
})();