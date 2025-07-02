const BaseURL = "https://www.uline.com/Product/Detail/";

let price = null;

// Listen for price from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg.action === "setPrice") {
		price = msg.price;
		console.log("Saved price as int:", price);
	}
});

async function StartGame() {
	// Hide results when starting a new game
	document.getElementById('result').style.display = "none";

	let productID;
	let valid = false;

	// Keep generating until a valid product is found
	while (!valid) {
		productID = RandomProductID();
		valid = await CheckProductID(productID);
		if (!valid) {
			console.log("Invalid product ID, generating a new one...");
		}
	}
	console.log("Valid product found!");

	const url = BaseURL + productID;
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.update(tabs[0].id, { url: url });
	});
}

// Generates a random product ID (H-1000 to H-9999)
function RandomProductID() {
	return "H-" + (Math.floor(Math.random() * 9000) + 1000);
}

// Check if a product ID exists by fetching the product page
async function CheckProductID(productID) {
	const fullURL = BaseURL + productID;
	console.log("Checking product ID:", productID, "at URL:", fullURL);

	try {
		const response = await fetch(fullURL);
		if (!response.ok) {
			// 404 or other HTTP error
			return false;
		}
		const html = await response.text();

		// Check for "not found" or "discontinued" in the HTML
		if (
			html.includes("Product Not Found") ||
			html.includes("discontinued") ||
			html.includes("no longer available")
		) {
			return false;
		}

		return true; // Product exists
	} catch (error) {
		// Network or other error
		return false;
	}
}

// Calculate the percentage match between a guess and the actual value
function PercentageMatch(guess, actual) {
	if (actual === 0) return 0;
	const diff = Math.abs(guess - actual);
	const match = 100 - ((diff / actual) * 100);
	return Math.max(0, Math.round(match));
}

// Sends a message to reveal prices on the product page
function RevealPrice() {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.sendMessage(tabs[0].id, { action: "revealPrice" });
	});
}

//#region Event Listeners
document.getElementById('openUline').addEventListener('click', function () {
	chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
		chrome.tabs.update(tabs[0].id, { url: "https://www.uline.com/" });
	});
});

document.getElementById('startGame').addEventListener('click', StartGame);

document.getElementById('guessPrice').addEventListener('click', function () {
	const guess = parseInt(document.getElementById('productPriceGuessInput').value, 10);
	if (isNaN(guess) || price === null) return;

	document.getElementById('guessedPrice').textContent = "You guessed: $" + guess;
	document.getElementById('actualPrice').textContent = "Actual price: $" + price;
	const match = PercentageMatch(guess, price);
	document.getElementById('matchPercent').textContent = "Match: " + match + "%";
	document.getElementById('result').style.display = "block";
	RevealPrice();
});
//#endregion