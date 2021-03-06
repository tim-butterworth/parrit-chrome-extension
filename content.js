const parritLocalStorageKey = "PARRIT";

const getActualBoards = () => R.filter(
	(board) => !board.classList.contains("exempt")
	, document.querySelectorAll(".pairing-board")
)

const gatherPairs = () => {
	const boards = document.querySelectorAll(".pairing-board");

	const allActualPairs = R.filter(
		(board) => !board.classList.contains("exempt")
		, boards
	);

	const pairs = R.map(
		(board) => ({
			room: board.querySelector(".pairing-board-name").innerText,
			people: R.map((person) => person.innerText, board.querySelectorAll(".person"))
		}),
		allActualPairs
	);

	return pairs;
}

const setupContentDiv = (futureSiblingElement) => {
	const contentDiv = document.createElement("div");
	const contentDivContent = document.createElement("pre");

	futureSiblingElement.parentNode.insertBefore(contentDiv, futureSiblingElement.nextSibling);
	contentDiv.appendChild(contentDivContent);
	contentDiv.style.padding = "10px";
	contentDiv.style.fontSize = "14px";
	contentDiv.style.lineHeight = 1;

	return contentDivContent;
}

const formatPairs = (pairs, roomLinkData) => {
	const tick = '`';

	const formatPeople = (people) => {
		if (people.length === 0) {
			return `${tick}EMPTY${tick}`;
		} else {
			return R.map((person) => `${tick}${person}${tick}`, people).join(" : ");
		}
	}

	const formatRoomLink = (roomName, roomLink) => {
		if (roomLink) {
			return `[${roomName}](${roomLink})`
		} else {
			return `${tick}${roomName}${tick}`;
		}
	}

	return R.map(
		({
			room
			, people
		}) => {
			const formattedRoomLink = formatRoomLink(room, roomLinkData[room]);

			return `${formatPeople(people)} -> ${formattedRoomLink}`
		}
		, pairs
	);
}

const createRedButton = (buttonText) => {
	const button = document.createElement("button");
	const buttonSpan = document.createElement("span");

	buttonSpan.innerText = buttonText;
	button.type = "button";
	button.appendChild(buttonSpan);
	button.classList.add("button-red");

	return button;
}

const setupButton = (buttonContainer, contentHolder, linkDataAccessor) => {
	const button = createRedButton("print pairs");

	buttonContainer.appendChild(button);

	button.onclick = () => {
		button.disabled = true;

		linkDataAccessor().then((linkData) => {
			const pairs = formatPairs(gatherPairs(), linkData);
			const pairText = pairs.join("\n");
			const pairClipboardText = pairs.join("\\n");
			contentHolder.innerText = pairText;
			console.log(pairText);

			const textarea = document.createElement('textarea');
			document.body.appendChild(textarea);
			textarea.textContent = pairText;
			textarea.focus();
			textarea.select();
			const result = document.execCommand('copy');
			if (result === 'unsuccessful') {
				console.error('Failed to copy text.');
			}
			document.body.removeChild(textarea);

			button.focus();

			button.disabled = false;
		})
	}
}

const writeToLocalStorage = (data) => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ [parritLocalStorageKey]: data }, function () {
			resolve("success");
		})
	})
}

const getLocalStorageData = () => {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(parritLocalStorageKey, function (result) {
			console.log('Value currently is ' + result[parritLocalStorageKey]);

			resolve(result[parritLocalStorageKey] || {});
		});
	});
}

const addButtonFunctionality = (buttonContainer) => {
	const contentHolder = setupContentDiv(document.querySelector(".sub-header"));
	setupButton(buttonContainer, contentHolder, getLocalStorageData);
}

const populateFromLocalStorage = (setters) => {
	getLocalStorageData().then((localStorageData) => {
		R.forEach(
			(setter) => setter(localStorageData)
			, setters
		)
	});
}

const addRegisterRoomLinks = (buttonContainer) => {
	const button = createRedButton("show add room links");

	buttonContainer.appendChild(button);

	const showAddRoomLinksFormContainer = document.createElement("div");
	showAddRoomLinksFormContainer.classList.add("add-links-form-container");

	const formStyles = {
		"z-index": 100,
		background: "grey",
		position: "absolute",
		padding: "10px",
		color: "black"
	}

	const keys = Object.keys(formStyles);

	R.forEach(
		(key) => {
			showAddRoomLinksFormContainer.style[key] = formStyles[key];
		}
		, keys
	)

	buttonContainer.appendChild(showAddRoomLinksFormContainer);

	const getRoomInputs = () => {
		const boards = getActualBoards();
		const boardText = R.map(
			(element) => element.querySelector(".pairing-board-name").innerText
			, boards
		)

		return R.map(
			(text) => {
				const inputContainer = document.createElement("div");
				const label = document.createElement("label");
				const input = document.createElement("input");

				label.innerText = text;
				input.setAttribute("type", "text");

				inputContainer.appendChild(label);
				inputContainer.appendChild(input);

				return {
					element: inputContainer,
					getValue: () => input.value,
					setValue: (values) => input.value = values[text] || "",
					key: text
				}
			}
			, boardText
		)
	}

	const getSaveButton = (clickHandler) => {
		const buttonContainer = document.createElement("div");
		const button = document.createElement("button");

		button.innerText = "save";
		button.onclick = clickHandler;
		button.style["color"] = "black";

		buttonContainer.style["padding"] = "10px";
		buttonContainer.appendChild(button);

		return buttonContainer;
	}

	const showAddRoomLinksForm = (container) => {
		const div = document.createElement("div");
		div.classList.add("add-links-form");
		div.innerText = "ADD LINKS FORM";

		container.appendChild(div);

		const roomInputs = getRoomInputs();
		const getters = [];
		const setters = [];
		R.forEach(
			({ element, getValue, setValue, key }) => {
				getters.push({
					getter: getValue,
					key
				});
				setters.push(setValue);
				div.appendChild(element);
			}
			, roomInputs
		)
		const saveButton = getSaveButton(() => {
			const updatedData = R.reduce(
				(accume, { getter, key }) => Object.assign({}, accume, { [key]: getter() })
				, {}
				, getters
			)

			const updateSaveButtonText = (updatedText) => saveButton.querySelector("button").innerText = updatedText;
			const updateDisabled = (disabled) => saveButton.querySelector("button").disabled = disabled;

			const originalLabel = saveButton.innerText;

			updateDisabled(true)
			updateSaveButtonText("SAVING");
			writeToLocalStorage(updatedData).then(() => {
				updateSaveButtonText(originalLabel);
				updateDisabled(false);
			});
		});

		div.appendChild(saveButton);

		populateFromLocalStorage(setters);
	}
	const hideAddRoomLinksForm = (container) => {
		const children = container.children;

		R.forEach((child) => container.removeChild(child), children);
	}
	const updateButtonText = (buttonElement, newText) => {
		buttonElement.querySelector("span").innerText = newText;
	}

	let addRoomLinksVisible = false;
	button.onclick = () => {
		addRoomLinksVisible = !addRoomLinksVisible;

		if (addRoomLinksVisible) {
			updateButtonText(button, "hide add room links")

			showAddRoomLinksForm(showAddRoomLinksFormContainer);
		} else {
			updateButtonText(button, "show add room links")

			hideAddRoomLinksForm(showAddRoomLinksFormContainer);
		}
	}
}

const addSpinnerFunctionality = () => {
	let recommendButton
	for (button of document.querySelectorAll("button")) {
		if (button.innerText.startsWith("Recommend")) {
			recommendButton = button;
		}
	}

	if (recommendButton) {
		recommendButton.onclick = () => {
			console.log(`the number of persons to assign = ${document.querySelector(".floating-parrits").querySelector(".person-list").querySelectorAll(".person").length}`)

			const container = document.querySelector(".project-page-container")
			const spinnerDiv = document.createElement("div")

			const imageUrl = chrome.runtime.getURL("lightning_r2d2.gif");
			const image = document.createElement("img");
			image.setAttribute("src", imageUrl);
			image.style.zIndex = "1001";
			image.style.marginTop = "25%";
			image.style.marginLeft = "auto";
			image.style.marginRight = "auto";
			image.style.display = "block";

			spinnerDiv.appendChild(image);

			spinnerDiv.style.position = "absolute";
			spinnerDiv.style.height = "100%";
			spinnerDiv.style.width = "100%";
			spinnerDiv.style.zIndex = "1000";
			spinnerDiv.style.background = "rgba(245, 245, 220, .5)"; //"beige"; //245	245	220

			container.appendChild(spinnerDiv);

			// should we have a max timeout
			let numberOfChecks = 0;
			const intervalId = setInterval(
				() => {
					const peopleToAssign = document.querySelector(".floating-parrits").querySelector(".person-list").querySelectorAll(".person").length;
					if (peopleToAssign === 0) {
						console.log("Stop spinning");

						container.removeChild(spinnerDiv);
						clearInterval(intervalId);
					} else {
						console.log(`checked ${numberOfChecks++} times`)
					}
				},
				200
			)
		}
	}
}

const onPageLoad = () => {
	const buttonContainers = document.querySelectorAll(".project-actions");

	if (buttonContainers.length > 0) {
		addRegisterRoomLinks(buttonContainers[0]);
		addButtonFunctionality(buttonContainers[0]);
		addSpinnerFunctionality()
	}
}

onPageLoad();
