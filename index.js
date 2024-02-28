import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js"
import { getDatabase, ref, onValue, push, remove, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js"

const appSettings = {
    databaseURL: "https://we-are-the-champions-c7473-default-rtdb.asia-southeast1.firebasedatabase.app"
}

// Firebase Init
const app = initializeApp(appSettings)
const database = getDatabase(app)
const endorsementListInDB = ref(database, "endorsement")

// HTML Elements Init
const txtAreaEndorsement = document.getElementById("txtarea-endorsement")
const inputFrom = document.getElementById("input-from")
const inputTo = document.getElementById("input-to")
const btnPublish = document.getElementById("btn-publish")
const endorsementContainer = document.getElementById("endorsement-container")

// Localstorage Init
let likedIDsByApp = JSON.parse(localStorage.getItem("likedIDs"))
if (!likedIDsByApp) {
    localStorage.setItem("likedIDs", JSON.stringify([]))
}

// Event listener on elements
btnPublish.addEventListener("click", publishEndorsement)
txtAreaEndorsement.addEventListener("input", function () {
    if (txtAreaEndorsement.value) {
        btnPublish.disabled = false
    } else {
        btnPublish.disabled = true
    }
})

// Realtime data from firebase
onValue(endorsementListInDB, function (snapshot) {
    const snapshotValue = snapshot.val()
    if (snapshot.exists()) {
        clearendorsementContainer()

        let itemsArray = Object.entries(snapshotValue).reverse()
        for (let i = 0; i < itemsArray.length; i++) {
            createEndorsementItemElement(itemsArray[i])
        }
    } else (
        endorsementContainer.textContent = "No data to be shown"
    )
})

// For every item found on database, do this function
function createEndorsementItemElement(endorsement) {
    // Variable initialization
    let endorsementItemEl = document.createElement("div")
    let endorsementToEl = document.createElement("p")
    let endorsementContentEl = document.createElement("div")
    let endorsementFooterEl = document.createElement("div")
    let endorsementFromEl = document.createElement("p")
    let endorsementLikesEl = document.createElement("div")
    let endorsementHeartEl = document.createElement("img")
    let endorsementTotalLikesEl = document.createElement("p")

    const endorsementID = endorsement[0]
    const endorsementValue = endorsement[1]

    //adding Classes for css styling
    endorsementItemEl.classList.add("endorsement-item")
    endorsementFooterEl.classList.add("endorsement-item-footer")
    endorsementLikesEl.classList.add("endorsement-likes")

    // Conditional for checking if endorsement liked or not
    endorsementHeartEl.setAttribute("src", `./assets/${validateLike(endorsementID) ? 'heart-fill' : 'heart'}.svg`)

    // HTML Structure we wanna made  
    // <div id="endorsement-container">
    //      <div class="endorsement-item">
    //      <p>To Someone</p>
    //      <div>Some Endorsement Messages</div>
    //      <div class="endorsement-item-footer">
    //          <p>From Someone</p>
    //          <div class="endorsement-likes">
    //              <img src="./assets/heart-fill.svg">
    //              <p>total likes</p>
    //          </div>
    //      </div>
    //      </div>
    // </div>

    // The appendchildren to their parent elements
    endorsementItemEl.appendChild(endorsementToEl)
    endorsementItemEl.appendChild(endorsementContentEl)
    endorsementItemEl.appendChild(endorsementFooterEl)
    endorsementFooterEl.appendChild(endorsementFromEl)
    endorsementFooterEl.appendChild(endorsementLikesEl)
    endorsementLikesEl.appendChild(endorsementHeartEl)
    endorsementLikesEl.appendChild(endorsementTotalLikesEl)

    // Element contents
    endorsementContentEl.textContent = endorsementValue.content
    endorsementToEl.textContent = `To ${endorsementValue.to}`
    endorsementFromEl.textContent = `From ${endorsementValue.from}`
    endorsementTotalLikesEl.textContent = endorsementValue.totalLikes

    // Handle when endorsement item is clicked, will update the number of likes and save the liked IDs to localstorage
    endorsementItemEl.addEventListener("click", function () {
        let exactLocationOfItemInDB = ref(database, `endorsement/${endorsementID}`)
        let updates = {}
        if (validateLike(endorsementID)) {
            updates = { ...endorsementValue, totalLikes: endorsementValue.totalLikes -= 1 }
            let indexOfLikedEndorsement = likedIDsByApp.indexOf(endorsementID)
            likedIDsByApp.splice(indexOfLikedEndorsement, 1)
        } else {

            updates = { ...endorsementValue, totalLikes: endorsementValue.totalLikes += 1 }
            likedIDsByApp.push(endorsementID)
        }

        localStorage.setItem("likedIDs", JSON.stringify(likedIDsByApp))
        update(exactLocationOfItemInDB, updates)
    })

    // Append to HTML
    endorsementContainer.append(endorsementItemEl)
}

// Function for publishing endorsement. Receive values from front-end, prepare data and push to DB
function publishEndorsement() {
    let txtAreaEndorsementValue = txtAreaEndorsement.value
    let inputFromValue = inputFrom.value
    let inputToValue = inputTo.value

    if (txtAreaEndorsementValue) {
        let payload = {
            content: txtAreaEndorsementValue,
            from: inputFromValue ? inputFromValue : "Anonymous",
            to: inputToValue ? inputToValue : "Everyone",
            totalLikes: 0
        }

        push(endorsementListInDB, payload)

        clearInputs()
    }
}

// To check if endorsement is liked by this device or not (checking from local storage)
function validateLike(endorsementID) {
    if (likedIDsByApp) {
        return likedIDsByApp.includes(endorsementID)
    } else {
        return false
    }
}

// Clear all input fields after pressing publish btn
function clearInputs() {
    txtAreaEndorsement.value = null
    inputFrom.value = null
    inputTo.value = null
}

// Clear HTML to prevent data duplication
function clearendorsementContainer() {
    endorsementContainer.innerHTML = null
}