# Setup

## Clone the repo

- `git clone https://github.com/tim-butterworth/parrit-chrome-extension.git`

## Enable Chrome Developer mode

- In Chrome go to `chrome://extensions`
- Top right corner enable `Developer mode`
- Click `Load unpacked` and select the checked out repo directory

# Usage

When you navigate to the team's parrit there should be two extra red buttons:

`show add room links`:
  - clicking will display a form where zoom room links can be added for each parrit room
  - these links will be stored in local storage so if no edits are required they should only need to be added once per machine
  - I have not verified if persistance works with incognito mode, but it may not
`print pairs`:
  - clicking this button will generate a message that can be pasted into slack or mattermost with the room name, people in the room, and the entered room links (if the room link is empty it will simply be left off)
  - the message will be displayed on the page and also put in your clipboard (you can just paste it)