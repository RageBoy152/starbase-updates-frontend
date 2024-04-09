import { deleteUpdate } from './script.js'
import { submitForm } from './script.js'
import { toggleEditUpdateUI } from './script.js'

// appends given update object to list as formatted html
export function appendUpdate(update) {
    // handles getting pfp url
    if (update.userId=='693191740961718400') {update.userId = '693191740961718420'}
    let pfpUrl = `https://cdn.discordapp.com/avatars/${update.userId}/${update.userAvatar}`
    if (!update.userAvatar || update.userAvatar == 'null') {pfpUrl = `https://cdn.discordapp.com/embed/avatars/0.png`}


    function timeStrToXYAgo(timeStr) {
        // get Z offset as timeStr is given in UTC+0
        let currentTime = new Date()
        let offsetMinutes = currentTime.getTimezoneOffset()
    
        let offsetHours = Math.floor(offsetMinutes / 60)



        // Convert the input string to a Date object
        const [datePart, timePart] = timeStr.split('Z')[0].split('T')
        const [year, month, day] = datePart.split('-').map(Number)
        let [hour, minute, second] = timePart.split('.')[0].split(':').map(Number)
        hour = hour-offsetHours
        const dateObject = new Date(year, month - 1, day, hour, minute, second)
    
        // Calculate the time difference between the current time and the input date
        const timeDifference = currentTime - dateObject
    
        // Define time periods in milliseconds
        const periods = [
        { name: 'year', duration: 365 * 24 * 60 * 60 * 1000 },
        { name: 'month', duration: 30 * 24 * 60 * 60 * 1000 },
        { name: 'week', duration: 7 * 24 * 60 * 60 * 1000 },
        { name: 'day', duration: 24 * 60 * 60 * 1000 },
        { name: 'hour', duration: 60 * 60 * 1000 },
        { name: 'minute', duration: 60 * 1000 },
        { name: 'second', duration: 1000 },
        ]
    
        // Find the appropriate time period and create the message
        for (const period of periods) {
        const periodCount = Math.floor(timeDifference / period.duration)
        if (periodCount > 0) {
            if (periodCount === 1) {
            return `${periodCount} ${period.name} ago`
            } else {
            return `${periodCount} ${period.name}s ago`
            }
        }
        }
    
        // If none of the periods match, return "just now"
        return "just now"
    }

    let pinIFill = ''
    let pinBtnMsg = 'Pin'
    if (update.pinned) {
        pinIFill = '-fill'
        pinBtnMsg = 'Unpin'
    }


    // appends
    let updateElem = `
        <div class="container-fluid border-bottom border-top border-white p-4 update-${update._id}" data-timestamp="${update.userTimestamp}" data-location="${update.location}" data-vehicle="${update.vehicle}" data-body="${update.body}" data-pinned="${update.pinned}" data-userid="${update.userId}" id="${update._id}">

            <div class="row align-items-center justify-content-start gy-3 g-lg-0 position-relative">
                <div class="col-1 col-lg-1 d-inline-flex justify-content-center me-2 me-lg-0">
                    <img src="${pfpUrl}" alt="PFP" class="pfp rounded-circle bg-secondary ratio ratio-1x1">
                </div>
                <div class="col-1 d-inline-flex justify-content-start">
                    <p class="my-auto uploader" id="${update.userId}">@${update.userName}</p>
                </div>
                <div class="col-1 col-lg-1 d-inline-flex justify-content-start justify-content-lg-center ms-auto">
                    <p class="ms-auto msg-options-dropdown-toggle" onclick="toggleDropDown(this)" role="button" style="z-index:1"><i class="bi bi-three-dots-vertical"></i></p>
                    <div class="container dropdown-msg-options flex-column">
                        <div class="row">
                            <p role="button" class="pin-update-btn mb-0">${pinBtnMsg} <i class="bi bi-pin-angle${pinIFill} ms-1"></i></p>
                        </div>
                        <div class="row">
                            <p role="button" class="edit-update-btn mb-0">Edit <i class="bi bi-pencil-fill ms-1"></i></p>
                        </div>
                        <div class="row">
                            <p role="button" id="text-danger" class="delete-update-btn mb-0">Delete <i class="bi bi-trash3 ms-1"></i></p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-3 px-xl-4 px-1 text-secondary">
                <div class="col d-inline-flex justify-content-start px-xl-4 px-1">
                    <p class="my-auto">${timeStrToXYAgo(update.createdAt)}</p>
                </div>
            </div>

            <div class="row mt-3 px-xl-4 px-1">
                <div class="col d-inline-flex justify-content-start px-xl-4 px-1">
                    <p class="my-auto">${update.body}</p>
                </div>
            </div>

            <div class="row mt-3 px-xl-4 px-1 gy-1">
                <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                    <i class="bi bi-clock"></i>
                    <p class="my-auto ms-3">${update.userTimestamp.replace('T', '<span class="mx-2">|</span>')}</p>
                </div>
                <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                    <i class="bi bi-rocket-takeoff"></i>
                    <p class="my-auto ms-3">${update.vehicle}</p>
                </div>
                <div class="col-12 d-inline-flex justify-content-start px-xl-4 px-1">
                    <i class="bi bi-geo-alt"></i>
                    <p class="my-auto ms-3">${update.location}</p>
                </div>
            </div>

        </div>
    `

    let container = $('#messagesContainer')[0]
    container.innerHTML = updateElem + $('#messagesContainer')[0].innerHTML
    if (update.pinned) {$('#pinnedMsgsContainer')[0].innerHTML += updateElem}


}



// fetches all updates from backend on page laod and runs appendUpdate() foreach
fetch(`${backendAPIURL}get-updates`).then(async (res)=>{
    let updates = await res.json()

    // append updates to html
    for (let i=0;i<updates.length;i++) {
        appendUpdate(updates[i])
    }

    // add onclick events to deleteUpdate btns
    for (let i=0;i<$('#messagesContainer > div').length;i++) {
        let updateElem = $('#messagesContainer > div')[i]
        let updateId = updateElem.id
        
        $(`#messagesContainer > div .pin-update-btn`)[i].onclick = ()=>{submitForm({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "message": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid'),
            "pinned": updateElem.getAttribute('data-pinned')
        },true)}
        $(`#messagesContainer > div .delete-update-btn`)[i].onclick = ()=>{deleteUpdate(updateId)}
        $(`#messagesContainer > div .edit-update-btn`)[i].onclick = ()=>{toggleEditUpdateUI({
            "updateId": updateId,
            "timestamp": updateElem.getAttribute('data-timestamp'),
            "location": updateElem.getAttribute('data-location'),
            "vehicle": updateElem.getAttribute('data-vehicle'),
            "body": updateElem.getAttribute('data-body'),
            "userId": updateElem.getAttribute('data-userid')
        })}
    }
    

}).catch((err)=>{
    // issue with fetching all updates from backend
    console.log(err)
})